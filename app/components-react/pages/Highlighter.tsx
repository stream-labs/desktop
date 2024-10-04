import ClipsView from 'components-react/highlighter/ClipsView';
import SettingsView from 'components-react/highlighter/SettingsView';
import { useVuex } from 'components-react/hooks';
import React, { useEffect, useState } from 'react';
import { TClip, IHighlighterData, IViewState } from 'services/highlighter';
import { Services } from 'components-react/service-provider';
import { Button } from 'antd';
import moment from 'moment';
import StreamView from 'components-react/highlighter/StreamView';
import ClipExp from 'components-react/highlighter/ClipExp';

export default function Highlighter(props: { params?: { view: string } }) {
  const openViewFromParams = props?.params?.view || '';

  const { HighlighterService, RecordingModeService } = Services;
  const v = useVuex(() => ({
    dismissedTutorial: HighlighterService.views.dismissedTutorial,
    useAiHighlighter: HighlighterService.views.useAiHighlighter,
  }));

  const [viewState, setViewState] = useState<IViewState>(
    openViewFromParams === 'stream' || v.dismissedTutorial
      ? { view: 'stream' }
      : { view: 'settings' },
  );

  // TODO: Below is currently always true. Add the handle correctly
  // if (viewState.view !== 'settings' && !v.clips.length && !v.dismissedTutorial && !v.error || ) {
  //   setViewState({ view: 'settings' });
  // }

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
            emitSetView={data => setViewFromEmit(data)}
          />
        </>
      );

    case 'stream':
      return (
        <>
          <StreamView
            emitSetView={data => {
              setViewFromEmit(data);
            }}
          />
        </>
      );
    case 'clips':
      return (
        <>
          <ClipExp
            emitSetView={data => {
              setViewFromEmit(data);
            }}
            props={{
              id: viewState.id,
              streamTitle: HighlighterService.views.highlightedStreams.find(
                s => s.id === viewState.id,
              )?.title,
            }}
          />
          {/* <ClipsView
            emitSetView={data => {
              setViewFromEmit(data);
            }}
            props={{
              id: viewState.id,
              streamTitle: HighlighterService.views.highlightedStreams.find(
                s => s.id === viewState.id,
              )?.title,
            }}
          /> */}
        </>
      );
    default:
      return <>DefaultView X{v.useAiHighlighter}X</>; // here it is undefined
  }

  // Dev purposes
  function devHeaderBar() {
    return (
      <>
        {/* <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={() => setView({ view: 'stream' })}>stream</Button>
          <Button onClick={() => setView({ view: 'clips', id: undefined })}>clips</Button>
          <Button onClick={async () => HighlighterService.actions.toggleAiHighlighter()}>
            AiHighlighter active: {v.useAiHighlighter.toString()}
          </Button>
        </div> */}
      </>
    );
  }

  function setViewFromEmit(data: IViewState) {
    if (data.view === 'clips') {
      console.log('setViewInOverview:', data.id);
      setView({
        view: data.view,
        id: data.id,
      });
    } else {
      setView({
        view: data.view,
        id: undefined,
      });
    }
  }

  function setView(view: IViewState) {
    setViewState(view);
  }
}
