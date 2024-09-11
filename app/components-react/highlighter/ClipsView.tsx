import { useVuex } from 'components-react/hooks';
import React, { useEffect, useMemo, useState } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './ClipsView.m.less';
import { IViewState, TClip, TStreamInfo } from 'services/highlighter';
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
import { sort } from 'semver';

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
  const [tempClipList, setTempClipList] = useState<{ id: string }[]>([]);
  const [showModal, rawSetShowModal] = useState<TModalClipsView | null>(null);
  const [modalWidth, setModalWidth] = useState('700px');

  const loadedClips = useMemo(() => HighlighterService.getClips(v.clips, props.id), [
    v.clips,
    JSON.stringify(props.id),
  ]);

  const clipMap = useMemo(() => {
    return new Map(loadedClips.map(clip => [clip.path, clip]));
  }, [loadedClips]);

  useEffect(() => {
    // Disables unneeded clips, and enables needed clips
    // console.log('loaded.clips length changed');

    if (tempClipList.length > 0) {
      setTempClipList([]);
    }

    HighlighterService.actions.enableOnlySpecificClips(HighlighterService.views.clips, props.id);
    HighlighterService.actions.loadClips(props.id);
  }, [loadedClips.length]);

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
          {loadedClips.filter(clip => clip.loaded === true).length}/{loadedClips.length} Clips
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

  function setClipOrder(clips: { id: string }[], streamId: string | undefined) {
    const oldClipArray = tempClipList.map(c => c.id);
    const newClipArray = clips.map(c => c.id);

    if (JSON.stringify(newClipArray) === JSON.stringify(oldClipArray)) {
      return;
    } else {
      if (streamId) {
        newClipArray.forEach((clip, index) => {
          const clipPath = clip;

          const existingClip = loadedClips.find(c => c.path === clipPath);
          let updatedStreamInfo;
          if (existingClip) {
            updatedStreamInfo = {
              ...existingClip.streamInfo,
              [streamId]: {
                ...existingClip.streamInfo?.[streamId],
                orderPosition: index,
              },
            };
          }

          HighlighterService.actions.UPDATE_CLIP({
            path: clipPath,
            streamInfo: updatedStreamInfo,
          });
        });
      } else {
        newClipArray.forEach((clip, index) => {
          const clipPath = clip;
          HighlighterService.actions.UPDATE_CLIP({
            path: clipPath,
            globalOrderPosition: index,
          });
        });
      }

      setTempClipList(clips);
      return;
    }
  }

  const [inspectedClipPath, setInspectedClipPath] = useState<string | null>(null);
  let inspectedClip: TClip | null;

  if (inspectedClipPath) {
    inspectedClip = loadedClips.find(c => c.path === inspectedClipPath) ?? null;
  }

  function closeModal() {
    // Do not allow closing export modal while export/upload operations are in progress
    if (v.exportInfo.exporting) return;
    if (v.uploadInfo.uploading) return;

    setInspectedClipPath(null);
    setShowModal(null);

    if (v.error) HighlighterService.actions.dismissError();
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>, streamId: string | undefined) {
    const extensions = SUPPORTED_FILE_TYPES.map(e => `.${e}`);
    const files: string[] = [];
    let fi = e.dataTransfer.files.length;
    while (fi--) {
      const file = e.dataTransfer.files.item(fi)?.path;
      if (file) files.push(file);
    }

    const filtered = files.filter(f => extensions.includes(path.parse(f).ext));

    if (filtered.length) {
      HighlighterService.actions.addClips(
        filtered.map(path => ({ path })),
        streamId,
        'Manual',
      );
    }

    e.stopPropagation();
  }
  function noClipsView(streamId: string | undefined) {
    return (
      <div
        style={{ width: '100%', display: 'flex' }}
        className={styles.clipsViewRoot}
        onDrop={event => onDrop(event, streamId)}
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
              <AddClip streamId={props.id} />
            </div>
          </div>{' '}
          <Scrollable style={{ flexGrow: 1, padding: '20px 0 20px 20px' }}>
            No clips found
          </Scrollable>
        </div>
      </div>
    );
  }

  //TODO: Need performance updateb
  function getClipsView(streamId: string | undefined) {
    let clipList;

    if (tempClipList.length === 0) {
      if (streamId) {
        const clipsWithOrder = loadedClips
          .filter(c => c.streamInfo?.[streamId]?.orderPosition !== undefined && c.deleted !== true)
          .sort(
            (a: TClip, b: TClip) =>
              a.streamInfo![streamId]!.orderPosition - b.streamInfo![streamId]!.orderPosition,
          )
          .map(c => ({
            id: c.path,
          }));

        const clipsWithOutOrder = loadedClips
          .filter(
            c =>
              (c.streamInfo === undefined ||
                c.streamInfo[streamId] === undefined ||
                c.streamInfo[streamId]?.orderPosition === undefined) &&
              c.deleted !== true,
          )
          .map(c => ({ id: c.path }));

        clipList = [...clipsWithOrder, ...clipsWithOutOrder];
      } else {
        const clipOrder = loadedClips
          .filter(c => c.deleted !== true)
          .sort((a: TClip, b: TClip) => a.globalOrderPosition - b.globalOrderPosition)
          .map(c => ({ id: c.path }));

        clipList = [...clipOrder];
      }
      setTempClipList(clipList);
    }

    return (
      <div
        style={{ width: '100%', display: 'flex' }}
        className={styles.clipsViewRoot}
        onDrop={event => onDrop(event, streamId)}
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
              <AddClip streamId={props.id} />
            </div>
          </div>

          {v.loaded ? (
            <Scrollable style={{ flexGrow: 1, padding: '20px 0 20px 20px' }}>
              <ReactSortable
                list={tempClipList}
                setList={clips => setClipOrder(clips, props.id)} //
                animation={200}
                filter=".sortable-ignore"
                onMove={e => {
                  return e.related.className.indexOf('sortable-ignore') === -1;
                }}
              >
                {tempClipList
                  .filter(c => clipMap.has(c.id))
                  .map(({ id }) => {
                    const clip = clipMap.get(id)!;
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
          {showModal === 'export' && <ExportModal close={closeModal} streamId={streamId} />}
          {showModal === 'preview' && <PreviewModal close={closeModal} streamId={streamId} />}
          {inspectedClip && showModal === 'remove' && (
            <RemoveClip close={closeModal} clip={inspectedClip} streamId={streamId} />
          )}
        </Modal>
      </div>
    );
  }
  if (loadedClips.length === 0) return noClipsView(props.id);
  return getClipsView(props.id);
}

function AddClip({ streamId }: { streamId: string | undefined }) {
  const { HighlighterService } = Services;

  async function openClips() {
    const selections = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: $t('Video Files'), extensions: SUPPORTED_FILE_TYPES }],
    });

    if (selections && selections.filePaths) {
      HighlighterService.actions.addClips(
        selections.filePaths.map(path => ({ path })),
        streamId,
        'Manual',
      );
    }
  }

  return <Button onClick={() => openClips()}>{$t('Add Clip')}</Button>;
}

function RemoveClip(p: { clip: TClip; streamId: string | undefined; close: () => void }) {
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
          HighlighterService.actions.removeClip(p.clip.path, p.streamId);
          p.close();
        }}
      >
        {$t('Remove')}
      </Button>
    </div>
  );
}
