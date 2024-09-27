import { useVuex } from 'components-react/hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './ClipsView.m.less';
import { IViewState, TClip, TStreamInfo } from 'services/highlighter';
import ClipPreview, { formatSecondsToHMS } from 'components-react/highlighter/ClipPreview';
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
import { EditingControls } from './EditingControls';
import ClipsFilter from './ClipsFilter';
import { sortClips } from './utils';

export type TModalClipsView = 'trim' | 'export' | 'preview' | 'remove';

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
  console.log('Render ClipsView');

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

  // const [tempClipList, setTempClipList] = useState<{ id: string }[]>([]);
  const [showModal, rawSetShowModal] = useState<TModalClipsView | null>(null);
  const [modalWidth, setModalWidth] = useState('700px');
  const [activeFilter, setActiveFilter] = useState('all');
  const sortedClips = useRef<TClip[]>([]);
  const sortedFilteredClips = useRef<TClip[]>([]);
  const sortedClipStrings = useRef<{ id: string }[]>([]);
  const sortedFilteredClipStrings = useRef<{ id: string }[]>([]);
  // await HighlighterService.actions.return.getClip. TODO M: Check if it cal stay like this
  const loadedClips = useMemo(() => HighlighterService.getClips(v.clips, props.id), [
    v.clips,
    JSON.stringify(props.id),
  ]);

  const clipMap = useMemo(() => {
    return new Map(loadedClips.map(clip => [clip.path, clip]));
  }, [loadedClips]);

  useEffect(() => {
    sortedClips.current = sortClips(loadedClips, props.id);
    sortedFilteredClips.current = sortedClips.current.filter(clip => {
      switch (activeFilter) {
        case 'ai':
          return clip.source === 'AiClip';
        case 'manual':
          return clip.source === 'Manual' || clip.source === 'ReplayBuffer';
        case 'all':
        default:
          return true;
      }
    });
    sortedClipStrings.current = sortedClips.current.map(clip => ({ id: clip.path }));
    sortedFilteredClipStrings.current = sortedFilteredClips.current.map(clip => ({
      id: clip.path,
    }));

    // Disables unneeded clips, and enables needed clips
    // console.log('loaded.clips length changed');/

    //TODO M: This overwrites currently enabled and disabled states
    HighlighterService.actions.enableOnlySpecificClips(HighlighterService.views.clips, props.id);
    HighlighterService.actions.loadClips(props.id);
  }, [loadedClips.length, activeFilter]);

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

  function setClipOrder(clips: { id: string }[], streamId: string | undefined) {
    const oldClipArray = sortedClipStrings.current.map(c => c.id);
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

      sortedClipStrings.current = clips;
      sortedFilteredClipStrings.current = clips;
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

    e.preventDefault();
    e.stopPropagation();
  }

  //TODO: Need performance updateb
  function getClipsView(
    streamId: string | undefined,
    sortedFilteredList: { id: string }[],
    sortedList: { id: string }[],
  ) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [onMove, setOnMove] = useState<boolean>(false);
    // console.log('rendering clips view');
    const totalDuration = loadedClips
      .filter(c => c.enabled)
      .reduce((acc, clip) => acc + clip.duration! - clip.startTrim! - clip.endTrim!, 0);
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
          <ClipsFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          {loadedClips.length === 0 ? (
            <> No clips found</>
          ) : (
            <>
              {v.loaded ? (
                <>
                  <Scrollable
                    horizontal={true}
                    style={{
                      width: '100%',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      height: '42px',
                    }}
                  >
                    <ReactSortable
                      style={{
                        width: 'max-content',
                        minWidth: '100%',
                        display: 'flex',
                        gap: '4px',
                        justifyContent: 'center',
                      }}
                      list={sortedList}
                      setList={clips => setClipOrder(clips, props.id)} //
                      animation={200}
                      filter=".sortable-ignore"
                      onEnd={() => setOnMove(false)}
                      onMove={e => {
                        setOnMove(true);
                        return e.related.className.indexOf('sortable-ignore') === -1;
                      }}
                    >
                      {sortedList
                        .filter(c => clipMap.has(c.id) && clipMap.get(c.id)!.enabled)
                        .map(({ id }) => {
                          const clip = clipMap.get(id)!;
                          return (
                            <div
                              key={'mini' + clip.path}
                              onMouseEnter={() => setHoveredId(id)}
                              onMouseLeave={() => setHoveredId(null)}
                            >
                              <MiniClipPreview
                                clip={clip}
                                highlighted={hoveredId === id && !onMove}
                              ></MiniClipPreview>
                            </div>
                          );
                        })}
                    </ReactSortable>
                  </Scrollable>{' '}
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      padding: '0px 24px',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>0m 0s</span> <span> {formatSecondsToHMS(totalDuration)} </span>
                  </div>
                  <Scrollable style={{ flexGrow: 1, padding: '20px 20px 20px 20px' }}>
                    <ReactSortable
                      list={sortedFilteredList}
                      setList={clips => setClipOrder(clips, props.id)} //
                      animation={200}
                      filter=".sortable-ignore"
                      onMove={e => {
                        setOnMove(true);
                        return e.related.className.indexOf('sortable-ignore') === -1;
                      }}
                      onEnd={() => setOnMove(false)}
                    >
                      {sortedFilteredList
                        .filter(c => clipMap.has(c.id))
                        .map(({ id }) => {
                          const clip = clipMap.get(id)!;
                          return (
                            <div
                              key={clip.path}
                              onMouseEnter={() => setHoveredId(id)}
                              onMouseLeave={() => setHoveredId(null)}
                              style={{
                                margin: '10px 20px 10px 0',
                                width: '100%',
                                display: 'inline-block',
                              }}
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
                                streamId={streamId}
                                highlighted={hoveredId === id && !onMove}
                              />
                            </div>
                          );
                        })}
                    </ReactSortable>
                  </Scrollable>
                </>
              ) : (
                getLoadingView()
              )}
            </>
          )}
        </div>
        {
          <EditingControls
            audio={v.audio}
            transition={v.transition}
            emitSetTransitionDuration={(duration: number) => {
              HighlighterService.actions.setTransition({ duration });
            }}
            emitSetMusicEnabled={(enabled: boolean) => {
              HighlighterService.actions.setAudio({ musicEnabled: enabled });
            }}
            emitSetMusicFile={(file: string) => {
              HighlighterService.actions.setAudio({ musicPath: file });
            }}
            emitSetMusicVolume={(volume: number) => {
              HighlighterService.actions.setAudio({ musicVolume: volume });
            }}
            emitSetShowModal={(modal: TModalClipsView) => {
              setShowModal(modal);
            }}
          />
        }
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
  return getClipsView(props.id, sortedFilteredClipStrings.current, sortedClipStrings.current);
}

function MiniClipPreview({ clip, highlighted }: { clip: TClip; highlighted: boolean }) {
  return (
    <div
      key={clip.path}
      style={{
        display: 'inline-block',
        borderRadius: '4px',
        border: `solid 2px ${highlighted ? '#4F5E65' : 'transparent'}`,
      }}
    >
      <img
        src={clip.scrubSprite}
        style={{
          width: `${SCRUB_WIDTH / 6}px`,
          height: `${SCRUB_HEIGHT / 6}px`,
          objectFit: 'cover',
          objectPosition: 'left top',
          borderRadius: '4px',
        }}
      ></img>
    </div>
  );
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
