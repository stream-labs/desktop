import ClipsView from 'components-react/highlighter/ClipsView';
import SettingsView from 'components-react/highlighter/SettingsView';
import { useVuex } from 'components-react/hooks';
import React, { useState } from 'react';
import { IClip } from 'services/highlighter';
import { Services } from 'components-react/service-provider';
import { Button } from 'antd';

interface IClipsViewState {
  view: 'clips';
  id: string;
}
interface IStreamViewState {
  view: 'stream';
}

interface ISettingsViewState {
  view: 'settings';
}

type IViewState = IClipsViewState | IStreamViewState | ISettingsViewState;

export default function Highlighter() {
  const [viewState, setViewState] = useState<IViewState>({ view: 'settings' });

  const { HighlighterService, HotkeysService, UsageStatisticsService } = Services;
  const v = useVuex(() => ({
    clips: HighlighterService.views.clips as IClip[],
    dismissedTutorial: HighlighterService.views.dismissedTutorial,
    error: HighlighterService.views.error,
  }));

  // TODO: Below is currently always true. Add the handle correctly
  // if (viewState.view !== 'settings' && !v.clips.length && !v.dismissedTutorial && !v.error || ) {
  //   setViewState({ view: 'settings' });
  // }

  console.log(viewState.view);
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
      return <> {devHeaderBar()}streamView</>;
      break;
    case 'clips':
      return (
        <>
          {devHeaderBar()}
          <ClipsView />
        </>
      );
      break;
    default:
      return <>DefaultView</>;
      break;
  }

  // Dev purposes
  function devHeaderBar() {
    return (
      <>
        <Button
          style={{ marginTop: '16px', marginRight: '8px' }}
          onClick={() => setView({ view: 'settings' })}
        >
          Settings
        </Button>
        <Button
          style={{ marginTop: '16px', marginRight: '8px' }}
          onClick={() => setView({ view: 'stream' })}
        >
          stream
        </Button>
        <Button
          style={{ marginTop: '16px', marginRight: '8px' }}
          onClick={() => setView({ view: 'clips', id: 'id' })}
        >
          clips
        </Button>
      </>
    );
  }

  function setView(view: IViewState) {
    setViewState(view);
  }
}
