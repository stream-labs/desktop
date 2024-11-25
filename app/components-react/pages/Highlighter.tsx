import SettingsView from 'components-react/highlighter/SettingsView';
import { useVuex } from 'components-react/hooks';
import React, { useState } from 'react';
import { EHighlighterView, IViewState } from 'services/highlighter';
import { Services } from 'components-react/service-provider';
import StreamView from 'components-react/highlighter/StreamView';
import ClipsView from 'components-react/highlighter/ClipsView';
import UpdateModal from 'components-react/highlighter/UpdateModal';

export default function Highlighter(props: { params?: { view: string } }) {
  const openViewFromParams = props?.params?.view || '';

  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    dismissedTutorial: HighlighterService.views.dismissedTutorial,
    useAiHighlighter: HighlighterService.views.useAiHighlighter,
    isUpdaterRunning: HighlighterService.views.isUpdaterRunning,
    highlighterVersion: HighlighterService.views.highlighterVersion,
    progress: HighlighterService.views.updaterProgress,
  }));

  const [viewState, setViewState] = useState<IViewState>(
    openViewFromParams === EHighlighterView.STREAM || v.dismissedTutorial
      ? { view: EHighlighterView.STREAM }
      : { view: EHighlighterView.SETTINGS },
  );

  const updaterModal = (
    <UpdateModal
      version={v.highlighterVersion}
      progress={v.progress}
      isVisible={v.isUpdaterRunning}
    />
  );

  switch (viewState.view) {
    case EHighlighterView.STREAM:
      return (
        <>
          {updaterModal}
          <StreamView
            emitSetView={data => {
              setViewFromEmit(data);
            }}
          />
        </>
      );
    case EHighlighterView.CLIPS:
      return (
        <>
          {updaterModal}
          <ClipsView
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
        </>
      );
    default:
      return (
        <>
          {updaterModal}
          <SettingsView
            close={() => {
              HighlighterService.actions.dismissTutorial();
            }}
            emitSetView={data => setViewFromEmit(data)}
          />
        </>
      );
  }

  function setViewFromEmit(data: IViewState) {
    if (data.view === EHighlighterView.CLIPS) {
      setView({
        view: data.view,
        id: data.id,
      });
    } else {
      setView({
        view: data.view,
      });
    }
  }

  function setView(view: IViewState) {
    setViewState(view);
  }
}
