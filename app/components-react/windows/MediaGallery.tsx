import React, { useEffect, useState } from 'react';
import electron, { clipboard } from 'electron';
import * as remote from '@electron/remote';
import cx from 'classnames';
import { IMediaGalleryFile, IMediaGalleryInfo } from 'services/media-gallery';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useSubscription } from 'components-react/hooks/useSubscription';
import { useVuex } from 'components-react/hooks';
import styles from './MediaGallery.m.less';
import { Tooltip, message } from 'antd';

const getTypeMap = () => ({
  title: {
    image: $t('Images'),
    audio: $t('Sounds'),
  },
  noFilesCopy: {
    image: $t("You don't have any uploaded images!"),
    audio: $t("You don't have any uploaded sounds!"),
  },
  noFilesBtn: {
    image: $t('Upload An Image'),
    audio: $t('Upload A Sound'),
  },
});

function formatBytes(bytes: number, argPlaces: number = 1) {
  if (!bytes) {
    return '0KB';
  }
  const divisor = Math.pow(10, argPlaces);
  const base = Math.log(bytes) / Math.log(1024);
  const suffix = ['', 'KB', 'MB', 'GB', 'TB'][Math.floor(base)];
  return Math.round(Math.pow(1024, base - Math.floor(base)) * divisor) / divisor + suffix;
}

interface IToast {
  el: HTMLElement;
  text: Function;
  goAway: Function;
}

export default function MediaGallery() {
  const {
    WindowsService,
    MediaGalleryService,
    UserService,
    MagicLinkService,
    WebsocketService,
  } = Services;

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<IMediaGalleryFile | null>(null);
  const [type, setType] = useState<'image' | 'audio' | null>(null);
  const [category, setCategory] = useState<'stock' | 'uploads' | null>(null);
  const [galleryInfo, setGalleryInfo] = useState<IMediaGalleryInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const typeMap = getTypeMap();
  const promiseId = WindowsService.state.child.queryParams?.promiseId;
  const filter = WindowsService.state.child.queryParams?.filter;

  useEffect(() => {
    if (filter) setType(filter);
    fetchGalleryInfo();

    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
    };
  }, []);

  useSubscription(WebsocketService.socketEvent, ev => {
    if (ev.type !== 'streamlabs_prime_subscribe') return;
    fetchGalleryInfo();
  });

  const { isPrime } = useVuex(() => ({
    isPrime: UserService.views.isPrime,
  }));

  async function fetchGalleryInfo() {
    setGalleryInfo(await MediaGalleryService.fetchGalleryInfo());
  }

  async function openFilePicker() {
    const choices = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile', 'multiSelections'],
    });
    if (choices && choices.filePaths) {
      upload(choices.filePaths);
    }
  }

  async function upload(filepaths: string[]) {
    if (!filepaths || !filepaths.length) return;
    setBusy(true);
    message.loading($t('Uploading...'), 0);
    setGalleryInfo(await MediaGalleryService.upload(filepaths));
    setBusy(false);
    message.destroy();
  }

  function upgradeToPrime() {
    MagicLinkService.linkToPrime('slobs-media-gallery');
    message.warning($t('You must have Streamlabs Prime to use this media'), 5);
  }

  function files() {
    if (!galleryInfo) return [];
    return galleryInfo.files.filter(file => {
      if (category !== 'stock' && file.isStock !== false) return false;
      if (category === 'stock' && file.isStock === false) return false;
      return !(type && file.type !== type);
    });
  }

  const title = (type && typeMap.title[type]) || $t('All Files');
  const noFilesCopy =
    (type && typeMap.noFilesCopy[type]) || $t("You don't have any uploaded files!");
  const noFilesBtn = (type && typeMap.noFilesBtn[type]) || $t('Upload A File');
  const totalUsage = galleryInfo?.totalUsage ?? 0;
  const maxUsage = galleryInfo?.maxUsage ?? 0;
  const usagePct = galleryInfo ? totalUsage / maxUsage : 0;
  const totalUsageLabel = formatBytes(totalUsage, 2);
  const maxUsageLabel = formatBytes(maxUsage, 2);

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer?.files) return;
    const mappedFiles = Array.from(e.dataTransfer.files).map(file => file.path);
    upload(mappedFiles);
    setDragOver(false);
  }

  function handleTypeFilter(t: 'audio' | 'image' | null, c: 'stock' | 'uploads' | null) {
    if (t !== type) setType(t);
    if (c !== category) setCategory(c);
  }

  function selectFile(file: IMediaGalleryFile, shouldSelect: boolean = false, e: React.MouseEvent) {
    e.preventDefault();
    if (filter && file.type !== filter) {
      message.error($t('Not a supported file type'), 1);
    }
    setSelectedFile(file);
    if (file.type === 'audio' && !shouldSelect) {
      if (audio) audio.pause();
      setAudio(new Audio(file.href));
      audio?.play();
    }
    if (shouldSelect) handleSelect();
  }

  function handleSelect() {
    if (!selectedFile) return WindowsService.actions.closeChildWindow();
    if (selectedFile.prime && !isPrime) {
      upgradeToPrime();
      return;
    }
    MediaGalleryService.actions.resolveFileSelect(promiseId, selectedFile);
    WindowsService.actions.closeChildWindow();
  }

  async function handleDelete() {
    if (selectedFile) {
      remote.dialog
        .showMessageBox(remote.getCurrentWindow(), {
          title: 'Streamlabs Desktop',
          type: 'warning',
          message: $t('Are you sure you want to delete this file? This action is irreversable.'),
          buttons: [$t('Cancel'), $t('OK')],
        })
        .then(async ({ response }) => {
          if (!response || !selectedFile) return;
          setGalleryInfo(await MediaGalleryService.actions.return.deleteFile(selectedFile));
          setSelectedFile(null);
        });
    }
  }

  async function handleCopy(href: string) {
    try {
      await clipboard.writeText(href);
      message.success($t('URL Copied'), 1);
    } catch (e: unknown) {
      message.error($t('Failed to copy URL'), 1);
    }
  }

  return (
    <ModalLayout onOk={handleSelect}>
      <div
        className={styles.container}
        onDragEnter={onDragEnter}
        onDragOver={onDragEnter}
        onDrop={handleFileDrop}
      >
        <div className="flex" style={{ height: '100%' }}>
          <div className={styles.leftPanel}>
            <div className={styles.dropzone} onClick={openFilePicker}>
              <i className="icon-cloud-backup" />
              {$t('Drag & Drop Upload')}
            </div>
            {['uploads', 'stock'].map((cat: 'uploads' | 'stock') => (
              <ul key={cat} className={styles.navList}>
                <div className={styles.listTitle}>
                  {cat === 'stock' ? $t('Stock Files') : $t('My Uploads')}
                </div>
                <li
                  className={cx(styles.listItem, {
                    [styles.active]: type === null && cat === category,
                  })}
                  onClick={() => handleTypeFilter(null, cat)}
                >
                  <i className="fa fa-file" />
                  {$t('All Files')}
                </li>
                <li
                  className={cx(styles.listItem, {
                    [styles.active]: type === 'image' && cat === category,
                  })}
                  onClick={() => handleTypeFilter('image', cat)}
                >
                  <i className="icon-image" />
                  {$t('Images')}
                </li>
                <li
                  className={cx(styles.listItem, {
                    [styles.active]: type === 'audio' && cat === category,
                  })}
                  onClick={() => handleTypeFilter('audio', cat)}
                >
                  <i className="icon-music" />
                  {$t('Sounds')}
                </li>
              </ul>
            ))}
            <div>
              <div>
                {totalUsageLabel} / {maxUsageLabel}
              </div>
              <div className={cx(styles.progressSlider, 'radius')}>
                <div
                  style={{ width: `${usagePct * 100}%` }}
                  className={cx(styles.progressSliderFill, 'radius')}
                />
              </div>
            </div>
          </div>
          <div className={styles.rightPanel}>
            <h4>{title}</h4>
            <div className={styles.toolbar}>
              <i className="icon-cloud-backup" onClick={openFilePicker} />
              <i
                className={cx('icon-trash', {
                  [styles.disabled]: !selectedFile || (selectedFile && selectedFile.isStock),
                })}
                onClick={handleDelete}
              />
            </div>
            {dragOver && (
              <div
                onDragOver={onDragEnter}
                onDragLeave={onDragLeave}
                className={cx(styles.dragOverlay, 'radius')}
              />
            )}
            {busy && <div className={styles.busyOverlay} />}
            {files().length > 0 && (
              <Scrollable className={styles.uploadsManagerList}>
                {files().map(file => (
                  <li
                    key={file.href}
                    className={cx(styles.uploadManagerItem, 'radius', {
                      [styles.selected]: selectedFile && selectedFile.href === file.href,
                    })}
                    onClick={e => selectFile(file, false, e)}
                    onDoubleClick={e => selectFile(file, true, e)}
                  >
                    {file.type === 'image' && /\.webm$/.test(file.href) && (
                      <video
                        autoPlay
                        muted
                        loop
                        src={file.href}
                        style={{ height: '100%', width: '100%' }}
                      />
                    )}
                    {file.type === 'image' && !/\.webm$/.test(file.href) && (
                      <div
                        className={styles.imagePreview}
                        style={{ backgroundImage: `url(${file.href})` }}
                      />
                    )}
                    {file.type === 'audio' && (
                      <i
                        className="icon-music"
                        style={{
                          height: '132px',
                          lineHeight: '132px',
                          fontSize: '28px',
                          textAlign: 'center',
                          display: 'block',
                        }}
                      />
                    )}
                    {!file.prime && (
                      <Tooltip title={$t('Copy URL')} placement="left">
                        <i className="icon-copy" onClick={() => handleCopy(file.href)} />
                      </Tooltip>
                    )}
                    <div
                      className={cx(styles.uploadFooter, { [styles.image]: file.type === 'image' })}
                    >
                      <div className={styles.uploadSize}>
                        {file.size ? formatBytes(file.size) : ' '}
                      </div>
                      <div className={styles.uploadTitle}>{file.filename}</div>
                      {file.prime && (
                        <div className={styles.uploadPrime}>
                          {$t('Prime')}
                          <i className="icon-prime" />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </Scrollable>
            )}

            {files().length < 1 && (
              <div className={styles.emptyBox}>
                <div>{noFilesCopy}</div>
                <div>
                  <button onClick={openFilePicker} className="button">
                    {noFilesBtn}
                  </button>
                  <button onClick={() => setCategory('stock')} className="button">
                    {$t('Browse the Gallery')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalLayout>
  );
}
