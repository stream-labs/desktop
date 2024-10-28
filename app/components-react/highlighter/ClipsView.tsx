import React, { useEffect, useState } from 'react';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
import styles from './ClipsView.m.less';
import { IAiClip, IViewState } from 'services/highlighter';
import ClipPreview, { formatSecondsToHMS } from 'components-react/highlighter/ClipPreview';
import { ReactSortable } from 'react-sortablejs';
import Scrollable from 'components-react/shared/Scrollable';
import { EditingControls } from './EditingControls';
import {
  aiFilterClips,
  createFinalSortedArray,
  filterClips,
  sortAndFilterClips,
  useOptimizedHover,
} from './utils';
import ClipsViewModal from './ClipsViewModal';
import { useVuex } from 'components-react/hooks';
import { Button } from 'antd';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import { $t } from 'services/i18n';
import path from 'path';
import MiniClipPreview from './MiniClipPreview';
import HighlightGeneratorUI from './HighlightGeneratorUI';

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
    sorted: { id: string }[];
    sortedFiltered: { id: string }[];
  }>({ sorted: [], sortedFiltered: [] });

  const [activeFilter, setActiveFilter] = useState('all');

  const [loaded, setLoaded] = useState<boolean>(false);
  useEffect(() => {
    async function loadClips() {
      await HighlighterService.actions.return.loadClips(props.id);
      setLoaded(true);
    }
    console.log(props.id);

    setLoaded(false);
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

      setClips({
        sorted: newClipArray.map(c => ({ id: c })),
        sortedFiltered: filterClips(updatedClips, activeFilter).map(c => ({ id: c.path })),
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

  //TODO: Need performance updateb
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
          </div>
          {sortedList.length === 0 ? (
            <> No clips found</>
          ) : (
            <>
              {loaded ? (
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
                      // onEnd={() => setOnMove(false)}
                      onMove={e => {
                        // setOnMove(true);
                        return e.related.className.indexOf('sortable-ignore') === -1;
                      }}
                    >
                      {sortedList.map(({ id }) => {
                        return (
                          <div
                            key={'mini' + id}
                            data-clip-id={id}
                            style={{ borderRadius: '6px' }}
                            // onMouseEnter={() => setHoveredId(id)}
                            // onMouseLeave={() => setHoveredId(null)}
                          >
                            <MiniClipPreview
                              clipId={id}
                              // highlighted={hoveredId === id && !onMove}
                              highlighted={false}
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
                    <span>0m 0s</span>
                    <VideoDuration streamId={streamId} />
                  </div>
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
                    {HighlighterService.getClips(HighlighterService.views.clips, props.id)
                      .filter(clip => clip.source === 'AiClip')
                      .every(clip => (clip as IAiClip).aiInfo.metadata?.round) && (
                      <HighlightGeneratorUI
                        emitSetFilter={filterOptions => {
                          const clips = HighlighterService.getClips(
                            HighlighterService.views.clips,
                            props.id,
                          );
                          const filteredClips = aiFilterClips(clips, streamId, filterOptions);
                          const filteredClipPaths = new Set(filteredClips.map(c => c.path));

                          clips.forEach(c => {
                            const shouldBeEnabled = filteredClipPaths.has(c.path);
                            const isEnabled = c.enabled;

                            if (shouldBeEnabled && !isEnabled) {
                              HighlighterService.enableClip(c.path, true);
                            } else if (!shouldBeEnabled && isEnabled) {
                              HighlighterService.disableClip(c.path);
                            }
                          });
                        }}
                        rounds={HighlighterService.getRounds(
                          HighlighterService.getClips(HighlighterService.views.clips, props.id),
                        )}
                      />
                    )}
                  </div>
                  {/* <ClipsFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} /> */}
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
                              padding: '2px',
                              borderRadius: '18px',
                              margin: '10px 20px 10px 0',
                              width: '100%',
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
                                showTrim={() => {
                                  setModal({ modal: 'trim', inspectedPathId: id });
                                }}
                                showRemove={() => {
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
                <ClipsLoadingView clips={clips.sorted} />
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
                  c => c.path !== clipId,
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

  // return getClipsView(props.id, shownSortedFilteredClipStrings, shownSortedClipStrings);
  return getClipsView(
    props.id,
    clips.sorted.map(c => ({ id: c.id })),
    clips.sortedFiltered.map(c => ({ id: c.id })),
  );
}

function VideoDuration({ streamId }: { streamId: string | undefined }) {
  const { HighlighterService } = Services;

  const clips = useVuex(() =>
    HighlighterService.getClips(HighlighterService.views.clips, streamId),
  );

  const totalDuration = clips
    .filter(c => c.enabled)
    .reduce((acc, clip) => acc + clip.duration! - clip.startTrim! - clip.endTrim!, 0);

  return <span>{formatSecondsToHMS(totalDuration)}</span>;
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

function ClipsLoadingView({ clips }: { clips: { id: string }[] }) {
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
