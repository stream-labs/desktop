import React, { useEffect } from 'react';
import cx from 'classnames';
import * as remote from '@electron/remote';
import { Tooltip, Menu, Button, message, Dropdown } from 'antd';
import { inject, injectState, useModule } from 'slap';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import {
  RecordingModeService,
  UserService,
  SharedStorageService,
  OnboardingService,
  WindowsService,
} from 'app-services';
import styles from './RecordingHistory.m.less';
import AutoProgressBar from 'components-react/shared/AutoProgressBar';
import { GetSLID } from 'components-react/highlighter/StorageUpload';

class RecordingHistoryModule {
  private RecordingModeService = inject(RecordingModeService);
  private UserService = inject(UserService);
  private SharedStorageService = inject(SharedStorageService);
  private OnboardingService = inject(OnboardingService);
  private WindowsService = inject(WindowsService);
  state = injectState({ showSLIDModal: false });

  get recordings() {
    return this.RecordingModeService.views.sortedRecordings;
  }

  get hasYoutube() {
    return this.UserService.views.linkedPlatforms.includes('youtube');
  }

  get hasSLID() {
    return !!this.UserService.views.auth?.slid?.id;
  }

  get uploadInfo() {
    return this.RecordingModeService.state.uploadInfo;
  }

  get uploadOptions() {
    const opts = [
      {
        label: $t('Convert to mobile-friendly short video'),
        value: 'crossclip',
        icon: 'icon-crossclip',
      },
      {
        label: $t('Add subtitles, transcribe, and more'),
        value: 'typestudio',
        icon: 'icon-mic',
      },
    ];
    if (this.hasYoutube) {
      opts.push({ label: $t('YouTube (private video)'), value: 'youtube', icon: 'icon-youtube' });
    }

    return opts;
  }

  connectSLID() {
    this.OnboardingService.actions.start({ isLogin: true });
    this.WindowsService.closeChildWindow();
  }

  handleSelect(filename: string, platform: string) {
    if (this.uploadInfo.uploading) {
      message.error($t('Upload already in progress'), 5);
      return;
    }
    if (platform === 'youtube') return this.uploadToYoutube(filename);
    if (this.hasSLID) {
      this.uploadToStorage(filename, platform);
    } else {
      this.state.setShowSLIDModal(true);
    }
  }

  formattedTimestamp(timestamp: string) {
    return this.RecordingModeService.views.formattedTimestamp(timestamp);
  }

  async uploadToYoutube(filename: string) {
    const id = await this.RecordingModeService.actions.return.uploadToYoutube(filename);
    if (!id) return;
    remote.shell.openExternal(`https://youtube.com/watch?v=${id}`);
  }

  async uploadToStorage(filename: string, platform: string) {
    const id = await this.RecordingModeService.actions.return.uploadToStorage(filename, platform);
    if (!id) return;
    remote.shell.openExternal(this.SharedStorageService.views.getPlatformLink(platform, id));
  }

  showFile(filename: string) {
    remote.shell.showItemInFolder(filename);
  }

  cancelUpload() {
    this.RecordingModeService.actions.cancelUpload();
  }
}

export default function RecordingHistory() {
  const {
    recordings,
    formattedTimestamp,
    showFile,
    uploadOptions,
    handleSelect,
    uploadInfo,
  } = useModule(RecordingHistoryModule);

  useEffect(() => {
    if (
      uploadInfo.error &&
      typeof uploadInfo.error === 'string' &&
      // We don't want to surface unexpected TS errors to the user
      !/TypeError/.test(uploadInfo.error)
    ) {
      message.error(uploadInfo.error, 5);
    }
  }, [uploadInfo.error]);

  function MenuItems(p: { filename: string }) {
    return (
      <Menu className={styles.menu}>
        {uploadOptions.map(opt => (
          <Menu.Item key={opt.value} onClick={() => handleSelect(p.filename, opt.value)}>
            <i className={opt.icon} />
            <span style={{ marginLeft: 8 }}>{opt.label}</span>
          </Menu.Item>
        ))}
      </Menu>
    );
  }

  return (
    <>
      <h2>{$t('Recordings')}</h2>
      <div className={styles.recordingsContainer} id="recordingHistory">
        {recordings.map(recording => (
          <div className={styles.recording} key={recording.timestamp}>
            <span style={{ marginRight: '8px' }}>{formattedTimestamp(recording.timestamp)}</span>
            <Tooltip title={$t('Show in folder')}>
              <span onClick={() => showFile(recording.filename)} className={styles.filename}>
                {recording.filename}
              </span>
            </Tooltip>
            {uploadOptions.length > 0 && (
              <Dropdown
                overlay={<MenuItems filename={recording.filename} />}
                placement="bottomRight"
                getPopupContainer={() => document.getElementById('recordingHistory')!}
              >
                <Button className={cx('button button--default', styles.uploadButton)}>
                  {$t('Upload To')}
                  <i className="icon-dropdown" />
                </Button>
              </Dropdown>
            )}
          </div>
        ))}
      </div>
      <ExportModal />
      <SLIDModal />
    </>
  );
}

function SLIDModal() {
  const { showSLIDModal, connectSLID } = useModule(RecordingHistoryModule);
  if (!showSLIDModal) return <></>;

  return (
    <div className={styles.modalBackdrop}>
      <ModalLayout
        hideFooter
        wrapperStyle={{
          width: '450px',
          height: '300px',
        }}
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <GetSLID onClick={connectSLID} />
      </ModalLayout>
    </div>
  );
}

function ExportModal() {
  const { uploadInfo, cancelUpload } = useModule(RecordingHistoryModule);
  const { uploadedBytes, totalBytes } = uploadInfo;

  if (!uploadedBytes || !totalBytes) return <></>;
  return (
    <div className={styles.modalBackdrop}>
      <ModalLayout
        hideFooter
        wrapperStyle={{
          width: '300px',
          height: '100px',
        }}
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <AutoProgressBar percent={uploadedBytes / totalBytes} timeTarget={1000 * 60} />
        <button className="button button--default" onClick={cancelUpload}>
          {$t('Cancel')}
        </button>
      </ModalLayout>
    </div>
  );
}
