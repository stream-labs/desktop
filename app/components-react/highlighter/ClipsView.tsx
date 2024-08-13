import { useVuex } from 'components-react/hooks';
import React, { useEffect, useState } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './ClipsView.m.less';
import { IViewState, TClip } from 'services/highlighter';
import ClipPreview from 'components-react/highlighter/ClipPreview';
import ClipTrimmer from 'components-react/highlighter/ClipTrimmer';
import { ReactSortable } from 'react-sortablejs';
import Form from 'components-react/shared/inputs/Form';
import isEqual from 'lodash/isEqual';
import { SliderInput, FileInput, SwitchInput } from 'components-react/shared/inputs';
import { Modal, Button, Alert } from 'antd';
import ExportModal from 'components-react/highlighter/ExportModal';
import PreviewModal from 'components-react/highlighter/PreviewModal';
import { SCRUB_HEIGHT, SCRUB_WIDTH, SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import path from 'path';
import Scrollable from 'components-react/shared/Scrollable';
import { IHotkey } from 'services/hotkeys';
import { getBindingString } from 'components-react/shared/HotkeyBinding';
import Animate from 'rc-animate';
import TransitionSelector from 'components-react/highlighter/TransitionSelector';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';

type TModalClipsView = 'trim' | 'export' | 'preview' | 'remove';

interface IClipsViewProps {
  id: string | undefined;
}

export default function ClipsView({
  props,
  emitSetView,
}: {
  props: IClipsViewProps;
  emitSetView: (data: IViewState) => void;
}) {
  const { HighlighterService, HotkeysService, UsageStatisticsService } = Services;
  const v = useVuex(() => ({
    clips: HighlighterService.views.clips,
    exportInfo: HighlighterService.views.exportInfo,
    uploadInfo: HighlighterService.views.uploadInfo,
    loadedCount: HighlighterService.views.loadedCount,
    loaded: HighlighterService.getClipsLoaded(HighlighterService.views.clips, props.id),
    transition: HighlighterService.views.transition,
    dismissedTutorial: HighlighterService.views.dismissedTutorial,
    audio: HighlighterService.views.audio,
    error: HighlighterService.views.error,
    highlightedStreams: HighlighterService.views.highlightedStreams,
  }));

  const [showModal, rawSetShowModal] = useState<TModalClipsView | null>(null);
  const [modalWidth, setModalWidth] = useState('700px');
  const [hotkey, setHotkey] = useState<IHotkey | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  console.log('das:', HighlighterService.getClips(HighlighterService.views.clips));

  useEffect(() => {
    if (HighlighterService.getClips(v.clips, props.id).length) {
      // Disables unneeded clips, and enables needed clips
      HighlighterService.actions.enableOnlySpecificClips(HighlighterService.views.clips, props.id);

      HighlighterService.actions.loadClips(props.id);
      setShowTutorial(false);
    }
  }, [HighlighterService.getClips(v.clips, props.id).length]);

  useEffect(() => {
    HotkeysService.actions.return.getGeneralHotkeyByName('SAVE_REPLAY').then(hotkey => {
      if (hotkey) setHotkey(hotkey);
    });
  }, []);

  useEffect(() => UsageStatisticsService.actions.recordFeatureUsage('Highlighter'), []);

  // This is kind of weird, but ensures that modals stay the right
  // size while the closing animation is played. This is why modal
  // width has its own state. This makes sure we always set the right
  // size whenever displaying a modal.
  function setShowModal(modal: TModalClipsView | null) {
    rawSetShowModal(modal);

    if (modal) {
      setModalWidth(
        {
          trim: '60%',
          preview: '700px',
          export: '700px',
          remove: '400px',
        }[modal],
      );
    }
  }

  function getLoadingView() {
    return (
      <div className={styles.clipLoader} style={{ display: 'grid', placeContent: 'center' }}>
        <h2>Loading</h2>
        <p>
          {' '}
          {v.clips.filter(clip => clip.loaded === true).length}/
          {HighlighterService.getClips(v.clips, props.id).length} Clips
        </p>
      </div>
    );
  }

  function getControls() {
    function setTransitionDuration(duration: number) {
      HighlighterService.actions.setTransition({ duration });
    }

    function setMusicEnabled(enabled: boolean) {
      HighlighterService.actions.setAudio({ musicEnabled: enabled });
    }

    const musicExtensions = ['mp3', 'wav', 'flac'];

    function setMusicFile(file: string) {
      if (!musicExtensions.map(e => `.${e}`).includes(path.parse(file).ext)) return;
      HighlighterService.actions.setAudio({ musicPath: file });
    }

    function setMusicVolume(volume: number) {
      HighlighterService.actions.setAudio({ musicVolume: volume });
    }

    return (
      <Scrollable
        style={{
          width: '300px',
          flexShrink: 0,
          background: 'var(--section)',
          borderLeft: '1px solid var(--border)',
          padding: '20px',
        }}
      >
        <Form layout="vertical">
          <TransitionSelector />
          <SliderInput
            label={$t('Transition Duration')}
            value={v.transition.duration}
            onChange={setTransitionDuration}
            min={0.5}
            max={5}
            step={0.1}
            debounce={200}
            hasNumberInput={false}
            tooltipPlacement="top"
            tipFormatter={v => `${v}s`}
          />
          <SwitchInput
            label={$t('Background Music')}
            value={v.audio.musicEnabled}
            onChange={setMusicEnabled}
          />
          <Animate transitionName="ant-slide-up">
            {v.audio.musicEnabled && (
              <div>
                <FileInput
                  label={$t('Music File')}
                  value={v.audio.musicPath}
                  filters={[{ name: $t('Audio File'), extensions: musicExtensions }]}
                  onChange={setMusicFile}
                />
                <SliderInput
                  label={$t('Music Volume')}
                  value={v.audio.musicVolume}
                  onChange={setMusicVolume}
                  min={0}
                  max={100}
                  step={1}
                  debounce={200}
                  hasNumberInput={false}
                  tooltipPlacement="top"
                  tipFormatter={v => `${v}%`}
                />
              </div>
            )}
          </Animate>
        </Form>
        <Button
          style={{ marginTop: '16px', marginRight: '8px' }}
          onClick={() => setShowModal('preview')}
        >
          {$t('Preview')}
        </Button>
        <Button type="primary" style={{ marginTop: '16px' }} onClick={() => setShowModal('export')}>
          {$t('Export')}
        </Button>
      </Scrollable>
    );
  }

  function setClipOrder(clips: { id: string }[]) {
    // ReactDraggable fires setList on mount. To avoid sync IPC,
    // we only fire off a request if the order changed.
    const oldOrder = HighlighterService.getClips(v.clips, props.id).map(c => c.path);
    const newOrder = clips.filter(c => c.id !== 'add').map(c => c.id);

    if (!isEqual(oldOrder, newOrder)) {
      // Intentionally synchronous to avoid visual jank on drop
      HighlighterService.setOrder(newOrder);
    }
  }

  const [inspectedClipPath, setInspectedClipPath] = useState<string | null>(null);
  let inspectedClip: TClip | null;

  if (inspectedClipPath) {
    inspectedClip = v.clips.find(c => c.path === inspectedClipPath) ?? null;
  }

  function closeModal() {
    // Do not allow closing export modal while export/upload operations are in progress
    if (v.exportInfo.exporting) return;
    if (v.uploadInfo.uploading) return;

    setInspectedClipPath(null);
    setShowModal(null);

    if (v.error) HighlighterService.actions.dismissError();
  }

  function getClipsView() {
    const clipList = [
      { id: 'add', filtered: true },
      ...v.clips.map(c => ({ id: c.path })).reverse(),
    ];
    console.log('🚀 ~ getClipsView ~ clipList:', clipList);

    function onDrop(e: React.DragEvent<HTMLDivElement>) {
      const extensions = SUPPORTED_FILE_TYPES.map(e => `.${e}`);
      const files: string[] = [];
      let fi = e.dataTransfer.files.length;
      while (fi--) {
        const file = e.dataTransfer.files.item(fi)?.path;
        if (file) files.push(file);
      }

      const filtered = files.filter(f => extensions.includes(path.parse(f).ext));

      if (filtered.length) {
        HighlighterService.actions.addClips(filtered);
      }

      e.stopPropagation();
    }

    return (
      <div
        style={{ width: '100%', display: 'flex' }}
        className={styles.clipsViewRoot}
        onDrop={onDrop}
      >
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', padding: 20 }}>
            <div style={{ flexGrow: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div
                  style={{ cursor: 'pointer', paddingTop: '2px' }}
                  onClick={() => emitSetView({ view: 'stream' })}
                >
                  <i className="icon-back" />
                </div>{' '}
                <h1 onClick={() => emitSetView({ view: 'stream' })} style={{ margin: 0 }}>
                  {' '}
                  {props.id
                    ? v.highlightedStreams.find(stream => stream.id === props.id)?.title ??
                      'Stream highlight clips'
                    : 'All highlight clips'}
                </h1>
              </div>
            </div>
            <div>
              <Button onClick={() => setShowTutorial(true)}>{$t('View Tutorial')}</Button>
            </div>
          </div>

          {v.loaded ? (
            <Scrollable style={{ flexGrow: 1, padding: '20px 0 20px 20px' }}>
              <ReactSortable
                list={clipList}
                setList={setClipOrder}
                animation={200}
                filter=".sortable-ignore"
                onMove={e => {
                  return e.related.className.indexOf('sortable-ignore') === -1;
                }}
              >
                <div
                  key="add"
                  style={{ margin: '10px 20px 10px 0', display: 'inline-block' }}
                  className="sortable-ignore"
                >
                  <AddClip />
                </div>
                {HighlighterService.getClips(v.clips, props.id).map(clip => {
                  return (
                    <div
                      key={clip.path}
                      style={{ margin: '10px 20px 10px 0', display: 'inline-block' }}
                    >
                      <ClipPreview
                        clip={clip}
                        showTrim={() => {
                          setInspectedClipPath(clip.path);
                          setShowModal('trim');
                        }}
                        showRemove={() => {
                          setInspectedClipPath(clip.path);
                          setShowModal('remove');
                        }}
                      />
                    </div>
                  );
                })}
              </ReactSortable>
            </Scrollable>
          ) : (
            getLoadingView()
          )}
        </div>
        {getControls()}
        <Modal
          getContainer={`.${styles.clipsViewRoot}`}
          onCancel={closeModal}
          footer={null}
          width={modalWidth}
          closable={false}
          visible={!!showModal || !!v.error}
          destroyOnClose={true}
          keyboard={false}
        >
          {!!v.error && <Alert message={v.error} type="error" showIcon />}
          {inspectedClip && showModal === 'trim' && <ClipTrimmer clip={inspectedClip} />}
          {showModal === 'export' && <ExportModal close={closeModal} />}
          {showModal === 'preview' && <PreviewModal close={closeModal} />}
          {inspectedClip && showModal === 'remove' && (
            <RemoveClip close={closeModal} clip={inspectedClip} />
          )}
        </Modal>
      </div>
    );
  }

  return getClipsView();
}

function AddClip() {
  const { HighlighterService } = Services;

  async function openClips() {
    const selections = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: $t('Video Files'), extensions: SUPPORTED_FILE_TYPES }],
    });

    if (selections && selections.filePaths) {
      HighlighterService.actions.addClips(selections.filePaths);
    }
  }

  return (
    <div
      style={{
        width: `${SCRUB_WIDTH}px`,
        height: `${SCRUB_HEIGHT}px`,
      }}
      className={styles.addClip}
      onClick={openClips}
    >
      <div style={{ fontSize: 24, textAlign: 'center', marginTop: 50 }}>
        <i className="icon-add" style={{ marginRight: 8 }} />
        {$t('Add Clip')}
      </div>
      <p style={{ textAlign: 'center' }}>{$t('Drag & drop or click to add clips')}</p>
    </div>
  );
}

function RemoveClip(p: { clip: TClip; close: () => void }) {
  const { HighlighterService } = Services;

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>{$t('Remove the clip?')}</h2>
      <p>
        {$t(
          'Are you sure you want to remove the clip? You will need to manually import it again to reverse this action.',
        )}
      </p>
      <Button style={{ marginRight: 8 }} onClick={p.close}>
        {$t('Cancel')}
      </Button>
      <Button
        type="primary"
        danger
        onClick={() => {
          HighlighterService.actions.removeClip(p.clip.path);
          p.close();
        }}
      >
        {$t('Remove')}
      </Button>
    </div>
  );
}
