import React, { useEffect, useState } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './ClipsView.m.less';
import { IViewState, TClip } from 'services/highlighter';
import ClipPreview from 'components-react/highlighter/ClipPreview';
import { ReactSortable } from 'react-sortablejs';
import Scrollable from 'components-react/shared/Scrollable';
import { EditingControls } from './EditingControls';
import { createFinalSortedArray, filterClips, sortAndFilterClips } from './utils';
import ClipsViewModal from './ClipsViewModal';

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

  const [loaded, setLoaded] = useState<boolean>(false);
  useEffect(() => {
    async function loadClips() {
      await HighlighterService.actions.return.loadClips(props.id);
      setLoaded(true);
      console.log('clips loaded');
    }
    setLoaded(false);
    setClips(sortAndFilterClips(HighlighterService.views.clips, props.id, 'all'));
    loadClips();
  }, [props.id]);

  function getLoadingView() {
    return (
      <div className={styles.clipLoader} style={{ display: 'grid', placeContent: 'center' }}>
        <h2>Loading</h2>
        <p> {clips.sorted.length} Clips</p>
      </div>
    );
  }

  const [modal, setModal] = useState<TModalClipsView | null>(null);

  function setClipOrder(listClips: { id: string }[], streamId: string | undefined) {
    console.log('setClipOrder');

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
        sortedFiltered: filterClips(updatedClips, 'all').map(c => ({ id: c.path })),
      });
      // setUpdateTrigger(prev => prev + 1);
      return;
    }
  }

  //TODO: Need performance updateb
  function getClipsView(streamId: string | undefined, sortedList: { id: string }[]) {
    return (
      <div style={{ width: '100%', display: 'flex' }} className={styles.clipsViewRoot}>
        {sortedList.length === 0 ? (
          <> No clips found</>
        ) : (
          <>
            {loaded ? (
              <>
                <Scrollable style={{ flexGrow: 1, padding: '20px 20px 20px 20px' }}>
                  <ReactSortable
                    list={sortedList}
                    setList={clips => setClipOrder(clips, props.id)} //
                    animation={200}
                    filter=".sortable-ignore"
                    onMove={e => {
                      // setOnMove(true);
                      return e.related.className.indexOf('sortable-ignore') === -1;
                    }}
                    // onEnd={() => setOnMove(false)}
                  >
                    {sortedList
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
                                setClips(
                                  sortAndFilterClips(
                                    HighlighterService.views.clips.filter(
                                      c => c.path !== clip.path,
                                    ),
                                    streamId,
                                    'all',
                                  ),
                                );
                                // HighlighterService.views.clips.filter(c => c.path !== clip.path),
                                HighlighterService.actions.removeClip(clip.path, streamId);
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
                      setModal(modal);
                    }}
                  />
                }
              </>
            ) : (
              getLoadingView()
            )}
          </>
        )}
        <ClipsViewModal streamId={props.id} modal={modal} onClose={() => setModal(null)} />
      </div>
    );
  }

  // return getClipsView(props.id, shownSortedFilteredClipStrings, shownSortedClipStrings);
  return getClipsView(
    props.id,

    clips.sorted.map(c => ({ id: c.id })),
  );
}
