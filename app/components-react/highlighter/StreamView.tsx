import { useVuex } from 'components-react/hooks';
import React, { useEffect, useState } from 'react';
import { Services } from 'components-react/service-provider';
// import styles from './ClipsView.m.less';
import styles from './StreamView.m.less';
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
import path, { relative } from 'path';
import Scrollable from 'components-react/shared/Scrollable';
import { IHotkey } from 'services/hotkeys';
import { getBindingString } from 'components-react/shared/HotkeyBinding';
import Animate from 'rc-animate';
import TransitionSelector from 'components-react/highlighter/TransitionSelector';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';

type TModal = 'trim' | 'export' | 'preview' | 'remove';

interface IClipsViewProps {
  id: string | undefined;
}

export default function StreamView({ emitSetView }: { emitSetView: (data: IViewState) => void }) {
  const { HighlighterService, HotkeysService, UsageStatisticsService } = Services;
  const v = useVuex(() => ({
    clips: HighlighterService.views.clips as TClip[],
    dismissedTutorial: HighlighterService.views.dismissedTutorial,
    highlightedStreams: HighlighterService.views.highlightedStreams,

    exportInfo: HighlighterService.views.exportInfo,
    error: HighlighterService.views.error,
  }));

  const [showModal, rawSetShowModal] = useState<TModal | null>(null);
  const [modalWidth, setModalWidth] = useState('700px');
  const [hotkey, setHotkey] = useState<IHotkey | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // This is kind of weird, but ensures that modals stay the right
  // size while the closing animation is played. This is why modal
  // width has its own state. This makes sure we always set the right
  // size whenever displaying a modal.
  function setShowModal(modal: TModal | null) {
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

  function removeStream(id?: string) {
    if (!id) {
      console.error('Cant remove stream, missing id');
      return;
    }
    HighlighterService.actions.removeStream(id);
  }

  async function exportVideo(id?: string) {
    if (!id) {
      console.error('Id needed to export stream clip collection, missing id');
      return;
    }
    (HighlighterService.views.clips as TClip[]).forEach(clip => {
      HighlighterService.actions.UPDATE_CLIP({
        path: clip.path,
        enabled: false,
      });
    });

    const clipsToEnable = HighlighterService.getClips(HighlighterService.views.clips, id);
    clipsToEnable.forEach(clip => {
      HighlighterService.actions.UPDATE_CLIP({
        path: clip.path,
        enabled: true,
      });
    });

    await HighlighterService.loadClips(id);

    console.log('startExport');
    HighlighterService.actions.export();
    // HighlighterService.actions.removeStream(id);
  }

  function setClipOrder(clips: { id: string }[]) {
    // ReactDraggable fires setList on mount. To avoid sync IPC,
    // we only fire off a request if the order changed.
    const oldOrder = v.clips.map(c => c.path);
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

    setInspectedClipPath(null);
    setShowModal(null);

    if (v.error) HighlighterService.actions.dismissError();
  }

  function getMomentTypeCount(clips: TClip[]): { [type: string]: number } {
    const typeCounts: { [type: string]: number } = {};

    clips.forEach(clip => {
      if (HighlighterService.isAiClip(clip)) {
        clip.aiInfo.moments.forEach(moment => {
          const type = moment.type;
          if (typeCounts[type]) {
            typeCounts[type] += 1;
          } else {
            typeCounts[type] = 1;
          }
        });
      }
    });

    return typeCounts;
  }

  function getWordingFromType(type: string): { emoji: string; description: string } {
    switch (type) {
      case 'kill':
        return { emoji: '💀', description: 'kills' };
      case 'death':
        return { emoji: '🪦', description: 'deaths' };
      case 'victory':
        return { emoji: '🏆', description: 'victory' };
      case 'deploy':
        return { emoji: '🪂', description: 'games started' };

      default:
        break;
    }
    return { emoji: type, description: type };
  }

  function getClipsView() {
    const clipList = [{ id: 'add', filtered: true }, ...v.clips.map(c => ({ id: c.path }))];

    return (
      <div
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        className={styles.streamViewRoot}
      >
        <div style={{ display: 'flex', padding: 20 }}>
          <div style={{ flexGrow: 1 }}>
            {/* <h1>{$t('Highlighter')}</h1>
            <p>{$t('Drag & drop to reorder clips.')}</p> */}
            <h1 style={{ margin: 0 }}>My stream highlights</h1>
          </div>
          <div>
            {hotkey && hotkey.bindings[0] && (
              <b style={{ marginRight: 20 }}>{getBindingString(hotkey.bindings[0])}</b>
            )}
            <Button onClick={() => emitSetView({ view: 'settings' })}>Settings</Button>
          </div>
        </div>
        <Scrollable style={{ flexGrow: 1, padding: '20px 0 20px 20px' }}>
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {v.highlightedStreams.map(highlightedStream => (
              <div key={highlightedStream.id} className={styles.streamCard}>
                <div className={styles.thumbnailWrapper}>
                  <img
                    style={{ height: '100%' }}
                    src={
                      v.clips.find(clip => clip.streamInfo?.id === highlightedStream.id)
                        ?.scrubSprite
                    }
                    alt=""
                  />
                  <div className={styles.centeredOverlayItem}>
                    {' '}
                    <div>{highlightedStream.state !== 'Done' ? highlightedStream.state : ''}</div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '20px',
                    paddingTop: '0px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '8px',
                      height: 'fit-content',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        height: 'fit-content',
                      }}
                    >
                      <h2 style={{ margin: 0 }}>{highlightedStream.title}</h2>
                      <p style={{ margin: 0, fontSize: '12px' }}>
                        {new Date(highlightedStream.date).toDateString()}
                      </p>
                    </div>
                    <div style={{ width: '74px', position: 'relative' }}>
                      <div
                        className={styles.centeredOverlayItem}
                        style={{ display: 'flex', gap: '3px', paddingRight: '3px' }}
                      >
                        <span>
                          {
                            v.clips.filter(clip => clip.streamInfo?.id === highlightedStream.id)
                              .length
                          }
                        </span>

                        <span>clips</span>
                      </div>
                      {v.clips
                        .filter(clip => clip.streamInfo?.id === highlightedStream.id)
                        .slice(0, 3) // Take only the first three clips that match
                        .map((clip, index) => (
                          <div
                            className={styles.thumbnailWrapperSmall}
                            style={{
                              rotate: `${(index - 1) * 6}deg`,
                              transform: `translate(${(index - 1) * 6}px, ${
                                index === 1 ? 0 : 2
                              }px)`,
                              zIndex: index === 1 ? 10 : 0,
                            }}
                            key={index}
                          >
                            <img
                              style={{ height: '100%' }}
                              src={clip.scrubSprite}
                              alt={`Clip ${index + 1}`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                  <div style={{ paddingTop: '6px', paddingBottom: '6px' }}>
                    <h3
                      style={{ margin: 0, display: 'flex', gap: '16px', justifyContent: 'start' }}
                    >
                      {highlightedStream.state === 'Done'
                        ? Object.entries(
                            getMomentTypeCount(
                              HighlighterService.getClips(v.clips, highlightedStream.id),
                            ),
                          ).map(([type, count]) => (
                            <div key={type} style={{ display: 'flex', gap: '4px' }}>
                              <span key={type + 'emoji'}>{getWordingFromType(type).emoji} </span>{' '}
                              <span key={type + 'desc'}>
                                {' '}
                                {count} {getWordingFromType(type).description}
                              </span>
                            </div>
                          ))
                        : 'Finding insteresting events...'}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Button
                      size="large"
                      style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                      disabled={highlightedStream.state !== 'Done'}
                      onClick={() => {
                        emitSetView({ view: 'clips', id: highlightedStream.id });
                      }}
                    >
                      <i className="icon-edit" /> Edit clips
                    </Button>
                    <Button
                      size="large"
                      style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                      onClick={() => removeStream(highlightedStream.id)}
                    >
                      <i className="icon-trash" />
                    </Button>
                    {/* TODO: What clips should be included when user clicks this button + bring normal export modal in here */}
                    <Button
                      size="large"
                      style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                      disabled={highlightedStream.state !== 'Done'}
                      type="primary"
                      onClick={() => exportVideo(highlightedStream.id)}
                    >
                      <i className="icon-download" /> Export highlight reel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* {v.clips.map(clip => {
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
            })} */}
        </Scrollable>

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
          {/* {inspectedClip && showModal === 'trim' && <ClipTrimmer clip={inspectedClip} />} */}
          {showModal === 'export' && <ExportModal close={closeModal} />}
          {showModal === 'preview' && <PreviewModal close={closeModal} />}
          {/* {inspectedClip && showModal === 'remove' && (
            <RemoveClip close={closeModal} clip={inspectedClip} />
          )} */}
        </Modal>
      </div>
    );
  }

  // if (!v.loaded) return getLoadingView();

  return getClipsView();
}
