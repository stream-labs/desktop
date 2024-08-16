import { useVuex } from 'components-react/hooks';
import React, { useState } from 'react';
import { Services } from 'components-react/service-provider';
// import styles from './ClipsView.m.less';
import styles from './StreamView.m.less';
import { IViewState, StreamInfoForAiHighlighter, TClip } from 'services/highlighter';
import isEqual from 'lodash/isEqual';
import { Modal, Button } from 'antd';
import ExportModal from 'components-react/highlighter/ExportModal';
import PreviewModal from 'components-react/highlighter/PreviewModal';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import Scrollable from 'components-react/shared/Scrollable';
import { IHotkey } from 'services/hotkeys';
import { getBindingString } from 'components-react/shared/HotkeyBinding';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';
import uuid from 'uuid';

type TModalStreamView =
  | { type: 'export'; id: string | undefined }
  | { type: 'preview'; id: string | undefined }
  | { type: 'upload' }
  | null;

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

  const [showModal, rawSetShowModal] = useState<TModalStreamView | null>(null);
  const [modalWidth, setModalWidth] = useState('700px');
  const [hotkey, setHotkey] = useState<IHotkey | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [preparingExport, setPreparingExport] = useState<string | null>(null);

  // This is kind of weird, but ensures that modals stay the right
  // size while the closing animation is played. This is why modal
  // width has its own state. This makes sure we always set the right
  // size whenever displaying a modal.
  function setShowModal(modal: TModalStreamView | null) {
    rawSetShowModal(modal);

    if (modal && modal.type) {
      setModalWidth(
        {
          trim: '60%',
          preview: '700px',
          export: '700px',
          remove: '400px',
          upload: '400px',
        }[modal.type],
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

  async function previewVideo(id?: string) {
    if (!id) {
      console.error('Id needed to preview stream clip collection, missing id');
      return;
    }
    setPreparingExport(id);
    HighlighterService.actions.enableOnlySpecificClips(HighlighterService.views.clips, id);
    try {
      await HighlighterService.loadClips(id);
      setPreparingExport(null);
      rawSetShowModal({ type: 'preview', id });
    } catch (error: unknown) {
      setPreparingExport(null);
    }
  }

  async function exportVideo(id?: string) {
    if (!id) {
      console.error('Id needed to export stream clip collection, missing id');
      return;
    }

    setPreparingExport(id);
    HighlighterService.actions.enableOnlySpecificClips(HighlighterService.views.clips, id);

    try {
      await HighlighterService.loadClips(id);
      setPreparingExport(null);
      rawSetShowModal({ type: 'export', id });
      console.log('startExport');
    } catch (error: unknown) {
      setPreparingExport(null);
    }
  }

  const [inspectedClipPath, setInspectedClipPath] = useState<string | null>(null);
  let inspectedClip: TClip | null;

  if (inspectedClipPath) {
    inspectedClip = v.clips.find(c => c.path === inspectedClipPath) ?? null;
  }

  function ImportStreamModal({ close }: { close: () => void }) {
    const { HighlighterService } = Services;
    const [inputValue, setInputValue] = useState<string>('');

    function handleInputChange(event: any) {
      setInputValue(event.target.value);
    }

    async function startAnalysis(title: string) {
      const streamInfo: StreamInfoForAiHighlighter = {
        id: 'manual_' + uuid(),
        title,
      };

      const filePath = await importStreamFromDevice();
      if (filePath) {
        HighlighterService.actions.flow(filePath[0], streamInfo);
        close();
      }
    }

    return (
      <>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '8px',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <h1 style={{ margin: 0 }}>Import stream</h1>
            <input
              style={{ width: '100%' }}
              type="text"
              name="name"
              placeholder="Set a title for your stream"
              onChange={handleInputChange}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            {' '}
            <Button type="default" onClick={() => close()}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => startAnalysis(inputValue)}>
              Select video to start import
            </Button>
          </div>
        </div>
      </>
    );
  }

  async function importStreamFromDevice() {
    const selections = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile'],
      filters: [{ name: $t('Video Files'), extensions: SUPPORTED_FILE_TYPES }],
    });

    if (selections && selections.filePaths) {
      return selections.filePaths;
    }
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

  function getStreamView() {
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
          <div style={{ display: 'flex', gap: '16px' }}>
            <Button onClick={() => setShowModal({ type: 'upload' })}>Import</Button>
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
            {v.highlightedStreams.length === 0 ? (
              <>No highlight clips created from streams</>
            ) : (
              <>
                {v.highlightedStreams.map(highlightedStream => (
                  <div key={highlightedStream.id} className={styles.streamCard}>
                    <div
                      className={`${styles.thumbnailWrapper} ${styles.videoSkeleton}`}
                      onClick={() => previewVideo(highlightedStream.id)}
                    >
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
                        <div>
                          {highlightedStream.state !== 'Done' ? highlightedStream.state : ''}
                          {preparingExport === highlightedStream.id ? (
                            <>
                              <div className={styles.loader}></div>
                            </>
                          ) : (
                            <>'▶️'</>
                          )}
                        </div>
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
                          style={{
                            margin: 0,
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'start',
                          }}
                        >
                          {highlightedStream.state === 'Done'
                            ? Object.entries(
                                getMomentTypeCount(
                                  HighlighterService.getClips(v.clips, highlightedStream.id),
                                ),
                              ).map(([type, count]) => (
                                <div key={type} style={{ display: 'flex', gap: '4px' }}>
                                  <span key={type + 'emoji'}>
                                    {getWordingFromType(type).emoji}{' '}
                                  </span>{' '}
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
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                          }}
                          disabled={highlightedStream.state !== 'Done'}
                          type="primary"
                          onClick={() => exportVideo(highlightedStream.id)}
                        >
                          {preparingExport === highlightedStream.id ? (
                            //  TODO: replace with correct loader
                            <div className={styles.loader}></div>
                          ) : (
                            <>
                              <i className="icon-download" /> Export highlight reel
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Scrollable>

        <Modal
          getContainer={`.${styles.streamViewRoot}`}
          onCancel={closeModal}
          footer={null}
          width={modalWidth}
          closable={false}
          visible={!!showModal}
          destroyOnClose={true}
          keyboard={false}
        >
          {/* {!!v.error && <Alert message={v.error} type="error" showIcon />} */}
          {/* {inspectedClip && showModal === 'trim' && <ClipTrimmer clip={inspectedClip} />} */}
          {showModal?.type === 'upload' && <ImportStreamModal close={closeModal} />}
          {showModal?.type === 'export' && (
            <ExportModal close={closeModal} streamId={showModal.id} />
          )}
          {showModal?.type === 'preview' && (
            <PreviewModal close={closeModal} streamId={showModal.id} />
          )}
          {/* {inspectedClip && showModal === 'remove' && (
            <RemoveClip close={closeModal} clip={inspectedClip} />
          )} */}
        </Modal>
      </div>
    );
  }

  // if (!v.loaded) return getLoadingView();

  return getStreamView();
}
