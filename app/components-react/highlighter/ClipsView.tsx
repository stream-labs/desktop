import React, { useEffect, useState } from 'react';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
import styles from './ClipsView.m.less';
import { EHighlighterView, IAiClip, IViewState, TClip } from 'services/highlighter';
import { ReactSortable } from 'react-sortablejs';
import Scrollable from 'components-react/shared/Scrollable';
import { EditingControls } from './EditingControls';
import {
  aiFilterClips,
  getCombinedClipsDuration,
  sortClipsByOrder,
  useOptimizedHover,
} from './utils';
import ClipsViewModal from './ClipsViewModal';
import { useVuex } from 'components-react/hooks';
import { Button } from 'antd';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import { $t } from 'services/i18n';
import path from 'path';
import ClipPreview from './ClipPreview';
export type TModalClipsView = 'trim' | 'export' | 'preview' | 'remove';

interface IClipsViewProps {
  id: string | undefined;
  streamTitle: string | undefined;
}

export default function ClipsView({
  props,
  emitSetView,
}: {
  props: IClipsViewProps;
  emitSetView: (data: IViewState) => void;
}) {
  const { HighlighterService, UsageStatisticsService } = Services;
  const [clips, setClips] = useState<{
    ordered: { id: string }[];
    orderedFiltered: { id: string }[];
  }>({ ordered: [], orderedFiltered: [] });

  const [activeFilter, setActiveFilter] = useState('all'); // Currently not using the setActiveFilter option

  const [clipsLoaded, setClipsLoaded] = useState<boolean>(false);
  useEffect(() => {
    async function loadClips() {
      await HighlighterService.actions.return.loadClips(props.id);
      setClipsLoaded(true);
    }

    setClipsLoaded(false);
    setClips(
      sortAndFilterClips(
        HighlighterService.getClips(HighlighterService.views.clips, props.id),
        props.id,
        activeFilter,
      ),
    );
    loadClips();
  }, [props.id]);

  useEffect(() => {
    setClips(
      sortAndFilterClips(
        HighlighterService.getClips(HighlighterService.views.clips, props.id),
        props.id,
        activeFilter,
      ),
    );
  }, [activeFilter]);

  useEffect(() => UsageStatisticsService.actions.recordFeatureUsage('Highlighter'), []);

  const [modal, setModal] = useState<{ modal: TModalClipsView; inspectedPathId?: string } | null>(
    null,
  );

  function setClipOrder(listClips: { id: string }[], streamId: string | undefined) {
    const newOrderOfSomeItems = listClips.map(c => c.id);
    const allItemArray = clips.ordered.map(c => c.id);
    const newClipArray = createFinalSortedArray(newOrderOfSomeItems, allItemArray);
    const oldClipArray = clips.ordered.map(c => c.id);

    if (JSON.stringify(newClipArray) === JSON.stringify(oldClipArray)) {
      return;
    } else {
      if (streamId) {
        newClipArray.forEach((clipId, index) => {
          const existingClip = HighlighterService.views.clipsDictionary[clipId];
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
            path: clipId,
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

      const updatedClips = newClipArray.map(
        clipId => HighlighterService.views.clipsDictionary[clipId],
      );

      setClips({
        ordered: newClipArray.map(c => ({ id: c })),
        orderedFiltered: filterClipsBySource(updatedClips, activeFilter).map(c => ({ id: c.path })),
      });
      return;
    }
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

  const containerRef = useOptimizedHover();

  function getClipsView(
    streamId: string | undefined,
    sortedList: { id: string }[],
    sortedFilteredList: { id: string }[],
  ) {
    return (
      <div
        ref={containerRef}
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
                  onClick={() => emitSetView({ view: EHighlighterView.SETTINGS })}
                >
                  <i className="icon-back" />
                </div>{' '}
                <h1
                  onClick={() => emitSetView({ view: EHighlighterView.SETTINGS })}
                  style={{ margin: 0 }}
                >
                  {' '}
                  {props.streamTitle ?? 'All highlight clips'}
                </h1>
              </div>
            </div>
          </div>
          {sortedList.length === 0 ? (
            <>
              {' '}
              No clips found
              <br />{' '}
              <div>
                <AddClip
                  streamId={props.id}
                  addedClips={() => {
                    setClips(
                      sortAndFilterClips(
                        HighlighterService.getClips(HighlighterService.views.clips, props.id),
                        props.id,
                        activeFilter,
                      ),
                    );
                  }}
                />
              </div>
            </> // TODO M: Add empty state
          ) : (
            <>
              {clipsLoaded ? (
                <>
                  {/* Disabled for now, will enable with the next version  */}
                  {/* <Scrollable
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
                      // onEnd={() => setOnMove(false)}
                      onMove={e => {
                        // setOnMove(true);
                        return e.related.className.indexOf('sortable-ignore') === -1;
                      }}
                    >
                      {sortedList.map(({ id }) => {
                        return (
                          <div key={'mini' + id} data-clip-id={id} style={{ borderRadius: '6px' }}>
                            <MiniClipPreview clipId={id}></MiniClipPreview>
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
                    <span>0m 0s</span>
                    <VideoDuration streamId={streamId} />
                  </div> */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '0 20px',
                      paddingTop: '16px',
                      paddingBottom: '2px',
                    }}
                  >
                    <AddClip
                      streamId={props.id}
                      addedClips={() => {
                        setClips(
                          sortAndFilterClips(
                            HighlighterService.getClips(HighlighterService.views.clips, props.id),
                            props.id,
                            activeFilter,
                          ),
                        );
                      }}
                    />
                  </div>
                  {/* Disabled for now, will enable with the next version
                  <ClipsFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} /> */}
                  <Scrollable style={{ flexGrow: 1, padding: '20px 20px 20px 20px' }}>
                    <ReactSortable
                      list={sortedFilteredList}
                      setList={clips => setClipOrder(clips, props.id)} //
                      animation={200}
                      filter=".sortable-ignore"
                      onMove={e => {
                        return e.related.className.indexOf('sortable-ignore') === -1;
                      }}
                    >
                      {sortedFilteredList.map(({ id }) => {
                        const clip = HighlighterService.views.clipsDictionary[id];
                        return (
                          <div
                            key={clip.path}
                            data-clip-id={id}
                            style={{
                              borderRadius: '18px',
                              margin: '10px 20px 10px 0',
                              display: 'inline-block',
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: '#111111',
                                borderRadius: '16px',
                              }}
                            >
                              <ClipPreview
                                clipId={id}
                                emitShowTrim={() => {
                                  setModal({ modal: 'trim', inspectedPathId: id });
                                }}
                                emitShowRemove={() => {
                                  setModal({ modal: 'remove', inspectedPathId: id });
                                }}
                                streamId={streamId}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </ReactSortable>
                  </Scrollable>
                </>
              ) : (
                <ClipsLoadingView streamId={props.id} />
              )}
            </>
          )}
        </div>
        <EditingControls
          emitSetShowModal={(modal: TModalClipsView) => {
            setModal({ modal });
          }}
        />
        <ClipsViewModal
          streamId={props.id}
          modal={modal}
          onClose={() => setModal(null)}
          deleteClip={(clipId, streamId) =>
            setClips(
              sortAndFilterClips(
                HighlighterService.getClips(HighlighterService.views.clips, props.id).filter(
                  clip => clip.path !== clipId,
                ),
                streamId,
                'all',
              ),
            )
          }
        />
      </div>
    );
  }

  return getClipsView(
    props.id,
    clips.ordered.map(clip => ({ id: clip.id })),
    clips.orderedFiltered.map(clip => ({ id: clip.id })),
  );
}

function AddClip({
  streamId,
  addedClips,
}: {
  streamId: string | undefined;
  addedClips: () => void;
}) {
  const { HighlighterService } = Services;

  async function openClips() {
    const selections = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: $t('Video Files'), extensions: SUPPORTED_FILE_TYPES }],
    });

    if (selections && selections.filePaths) {
      await HighlighterService.actions.return.addClips(
        selections.filePaths.map(path => ({ path })),
        streamId,
        'Manual',
      );
      await HighlighterService.actions.return.loadClips(streamId);
      addedClips();
    }
  }
  return (
    <Button
      size="middle"
      onClick={() => openClips()}
      style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
    >
      <i className="icon-add-circle  " />
      {$t('Add Clip')}
    </Button>
  );
}

function ClipsLoadingView({ streamId }: { streamId: string | undefined }) {
  const { HighlighterService } = Services;
  const clips = useVuex(() =>
    HighlighterService.getClips(HighlighterService.views.clips, streamId),
  );

  return (
    <div className={styles.clipLoader} style={{ display: 'grid', placeContent: 'center' }}>
      <h2>Loading</h2>
      <p>
        {clips.filter(clip => clip.loaded).length}/{clips.length} Clips
      </p>
    </div>
  );
}

export function clipsToStringArray(clips: TClip[]): { id: string }[] {
  return clips.map(c => ({ id: c.path }));
}

export function createFinalSortedArray(
  newOrderOfSomeItems: string[],
  allItemArray: string[],
): string[] {
  const finalArray: (string | null)[] = new Array(allItemArray.length).fill(null);
  const itemsNotInNewOrder = allItemArray.filter(item => !newOrderOfSomeItems.includes(item));

  itemsNotInNewOrder.forEach(item => {
    const index = allItemArray.indexOf(item);
    finalArray[index] = item;
  });

  let newOrderIndex = 0;
  for (let i = 0; i < finalArray.length; i++) {
    if (finalArray[i] === null) {
      finalArray[i] = newOrderOfSomeItems[newOrderIndex];
      newOrderIndex++;
    }
  }

  return finalArray.filter((item): item is string => item !== null);
}

export function filterClipsBySource(clips: TClip[], filter: string) {
  return clips.filter(clip => {
    switch (filter) {
      case 'ai':
        return clip.source === 'AiClip';
      case 'manual':
        return clip.source === 'Manual' || clip.source === 'ReplayBuffer';
      case 'all':
      default:
        return true;
    }
  });
}
export function sortAndFilterClips(clips: TClip[], streamId: string | undefined, filter: string) {
  const orderedClips = sortClipsByOrder(clips, streamId);
  const filteredClips = filterClipsBySource(orderedClips, filter);
  const ordered = orderedClips.map(clip => ({ id: clip.path }));
  const orderedFiltered = filteredClips.map(clip => ({
    id: clip.path,
  }));

  return { ordered, orderedFiltered };
}
