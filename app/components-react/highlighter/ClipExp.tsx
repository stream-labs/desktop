import React, { useEffect, useState } from 'react';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
import styles from './ClipsView.m.less';
import { IViewState, TClip } from 'services/highlighter';
import ClipPreview from 'components-react/highlighter/ClipPreview';
import { ReactSortable } from 'react-sortablejs';
import Scrollable from 'components-react/shared/Scrollable';
import { EditingControls } from './EditingControls';
import { createFinalSortedArray, filterClips, sortAndFilterClips } from './utils';
import ClipsViewModal from './ClipsViewModal';
import ClipsFilter from './ClipsFilter';
import { useVuex } from 'components-react/hooks';
import { Button } from 'antd';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import { $t } from 'services/i18n';

export type TModalClipsView = 'trim' | 'export' | 'preview' | 'remove';

interface IClipsViewProps {
  id: string | undefined;
  streamTitle: string | undefined;
}

export default function ClipExp({
  props,
  emitSetView,
}: {
  props: IClipsViewProps;
  emitSetView: (data: IViewState) => void;
}) {
  console.log('Render ClipsView');

  const { HighlighterService, HotkeysService, UsageStatisticsService } = Services;

  const [clips, setClips] = useState<{
    sorted: { id: string }[];
    sortedFiltered: { id: string }[];
  }>({ sorted: [], sortedFiltered: [] });

  const [activeFilter, setActiveFilter] = useState('all');

  const [loaded, setLoaded] = useState<boolean>(false);
  useEffect(() => {
    async function loadClips() {
      await HighlighterService.actions.return.loadClips(props.id);
      setLoaded(true);
      console.log('clips loaded');
    }
    setLoaded(false);
    setClips(sortAndFilterClips(HighlighterService.views.clips, props.id, activeFilter));
    loadClips();
  }, [props.id]);

  useEffect(() => {
    console.log('activeFilter', activeFilter);

    setClips(sortAndFilterClips(HighlighterService.views.clips, props.id, activeFilter));
  }, [activeFilter]);

  const [modal, setModal] = useState<{ modal: TModalClipsView; inspectedPathId?: string } | null>(
    null,
  );

  function setClipOrder(listClips: { id: string }[], streamId: string | undefined) {
    let newOrderOfSomeItems = listClips.map(c => c.id);
    let allItemArray = clips.sorted.map(c => c.id);
    const newClipArray = createFinalSortedArray(newOrderOfSomeItems, allItemArray);
    const oldClipArray = clips.sorted.map(c => c.id);

    // const newClipArray = clips.map(c => c.id);

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
      console.log('updatedClips', updatedClips);

      setClips({
        sorted: newClipArray.map(c => ({ id: c })),
        sortedFiltered: filterClips(updatedClips, activeFilter).map(c => ({ id: c.path })),
      });
      // setUpdateTrigger(prev => prev + 1);
      return;
    }
  }

  //TODO: Need performance updateb
  function getClipsView(
    streamId: string | undefined,
    sortedList: { id: string }[],
    sortedFilteredList: { id: string }[],
  ) {
    return (
      <div
        style={{ width: '100%', display: 'flex' }}
        className={styles.clipsViewRoot}
        // onDrop={event => onDrop(event, streamId)}
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
                  {props.streamTitle ?? 'All highlight clips'}
                </h1>
              </div>
            </div>
            <div>
              <AddClip
                streamId={props.id}
                addedClips={() => {
                  setClips(
                    sortAndFilterClips(HighlighterService.views.clips, props.id, activeFilter),
                  );
                }}
              />
            </div>
          </div>
          {sortedFilteredList.length === 0 ? (
            <> No clips found</>
          ) : (
            <>
              {loaded ? (
                <>
                  <ClipsFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
                  <Scrollable style={{ flexGrow: 1, padding: '20px 20px 20px 20px' }}>
                    <ReactSortable
                      list={sortedFilteredList}
                      setList={clips => setClipOrder(clips, props.id)} //
                      animation={200}
                      filter=".sortable-ignore"
                      onMove={e => {
                        // setOnMove(true);
                        return e.related.className.indexOf('sortable-ignore') === -1;
                      }}
                      // onEnd={() => setOnMove(false)}
                    >
                      {sortedFilteredList
                        // .filter(c => clipMap.has(c.id))
                        .map(({ id }) => {
                          const clip = HighlighterService.views.clipsDictionary[id];
                          return (
                            <div
                              key={clip.path}
                              // onMouseEnter={() => setHoveredId(id)}
                              // onMouseLeave={() => setHoveredId(null)}
                              style={{
                                margin: '10px 20px 10px 0',
                                width: '100%',
                                display: 'inline-block',
                              }}
                            >
                              <ClipPreview
                                clipId={id}
                                showTrim={() => {}}
                                showRemove={() => {
                                  setModal({ modal: 'remove', inspectedPathId: id });
                                  // HighlighterService.views.clips.filter(c => c.path !== clip.path),
                                  // HighlighterService.actions.removeClip(clip.path, streamId);
                                }}
                                streamId={streamId}
                                highlighted={false}
                                // highlighted={hoveredId === id && !onMove}
                              />
                            </div>
                          );
                        })}
                    </ReactSortable>
                  </Scrollable>{' '}
                  {
                    <EditingControls
                      emitSetShowModal={(modal: TModalClipsView) => {
                        setModal({ modal });
                      }}
                    />
                  }
                </>
              ) : (
                <ClipsLoadingView clips={clips.sorted} />
              )}
            </>
          )}
          <ClipsViewModal
            streamId={props.id}
            modal={modal}
            onClose={() => setModal(null)}
            deleteClip={(clipId, streamId) =>
              setClips(
                sortAndFilterClips(
                  HighlighterService.views.clips.filter(c => c.path !== clipId),
                  streamId,
                  'all',
                ),
              )
            }
          />
        </div>
      </div>
    );
  }

  // return getClipsView(props.id, shownSortedFilteredClipStrings, shownSortedClipStrings);
  return getClipsView(
    props.id,
    clips.sorted.map(c => ({ id: c.id })),
    clips.sortedFiltered.map(c => ({ id: c.id })),
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

  return <Button onClick={() => openClips()}>{$t('Add Clip')}</Button>;
}
function ClipsLoadingView({ clips }: { clips: { id: string }[] }) {
  console.log('Render ClipsLoadingView');

  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    loadedCount: HighlighterService.views.loadedCount,
  }));

  return (
    <div className={styles.clipLoader} style={{ display: 'grid', placeContent: 'center' }}>
      <h2>Loading</h2>
      <p>
        {' '}
        {v.loadedCount}/{clips.length} Clips
      </p>
    </div>
  );
}
