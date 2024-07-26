import ClipsView from 'components-react/highlighter/ClipsView';
import SettingsView from 'components-react/highlighter/SettingsView';
import { useVuex } from 'components-react/hooks';
import React, { useState } from 'react';
import { TClip, IHighlighterData } from 'services/highlighter';
import { Services } from 'components-react/service-provider';
import { Button } from 'antd';
import moment from 'moment';
import styles from '../highlighter/StreamView.m.less';

interface TClipsViewState {
  view: 'clips';
  id: string | undefined;
}
interface IStreamViewState {
  view: 'stream';
}

interface ISettingsViewState {
  view: 'settings';
}

type IViewState = TClipsViewState | IStreamViewState | ISettingsViewState;

export default function Highlighter() {
  const [viewState, setViewState] = useState<IViewState>({ view: 'settings' });

  const { HighlighterService, RecordingModeService } = Services;
  const v = useVuex(() => ({
    clips: HighlighterService.views.clips as TClip[],
    dismissedTutorial: HighlighterService.views.dismissedTutorial,
    error: HighlighterService.views.error,
    useAiHighlighter: HighlighterService.views.useAiHighlighter,
    recordings: RecordingModeService.views.sortedRecordings,
  }));

  const streamsFromClipStreamInfo = v.clips
    ? [...new Set(v.clips!.map(d => d.streamInfo?.id))]
    : [];

  // TODO: Below is currently always true. Add the handle correctly
  // if (viewState.view !== 'settings' && !v.clips.length && !v.dismissedTutorial && !v.error || ) {
  //   setViewState({ view: 'settings' });
  // }

  // let streamMockdata: { id: string; videoUri: string }[] = [{ id: '123', videoUri: '234' }];
  let streamMockdata: { id: string; videoUri: string; highlighterData: any }[] = v.recordings.map(
    recording => ({
      id: recording.timestamp,
      videoUri: recording.filename,
      highlighterData: { start: 2, end: 4, type: 'lol' },
    }),
  );

  switch (viewState.view) {
    case 'settings':
      // TODO: Add show tutorial
      return (
        <>
          {devHeaderBar()}
          <SettingsView
            close={() => {
              HighlighterService.actions.dismissTutorial();
              // TODO
              // setShowTutorial(false);
            }}
          />
        </>
      );

      break;

    case 'stream':
      return (
        <>
          {' '}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '20px',
            }}
          >
            {devHeaderBar()}{' '}
            <div className={styles.streamsWrapper}>
              {' '}
              {streamsFromClipStreamInfo.map(streamId => (
                <div key={streamId} className={styles.streamCard}>
                  <div className={styles.thumbnailWrapper}>
                    <img
                      style={{ height: '100%' }}
                      src={v.clips.find(clip => clip.streamInfo?.id === streamId)?.scrubSprite}
                      alt=""
                    />
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
                    <div style={{}}>{streamId}</div>

                    <div
                      style={{
                        display: 'flex',

                        gap: '4px',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Button
                        onClick={() =>
                          setView({
                            view: 'clips',
                            id: streamId,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button type="primary">Export</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      );
      break;
    case 'clips':
      return (
        <>
          <Button onClick={() => setView({ view: 'stream' })}>X</Button>
          <ClipsView id={viewState.id} />
        </>
      );
      break;
    default:
      return <>DefaultView X{v.useAiHighlighter}X</>; // here it is undefined
      break;
  }

  // Dev purposes
  function devHeaderBar() {
    return (
      <>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={() => setView({ view: 'settings' })}>Settings</Button>
          <Button onClick={() => setView({ view: 'stream' })}>stream</Button>
          <Button onClick={() => setView({ view: 'clips', id: 'id' })}>clips</Button>
          <Button onClick={() => trimHighlightData()}>create clips</Button>
          <Button onClick={async () => HighlighterService.actions.toggleAiHighlighter()}>
            AiHighlighter active: {v.useAiHighlighter.toString()}
          </Button>
        </div>
      </>
    );
  }

  function setView(view: IViewState) {
    setViewState(view);
  }

  async function trimHighlightData() {
    // HighlighterService.actions.flow('das', null);
  }
}
