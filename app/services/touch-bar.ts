import { Service, Inject } from 'services/core';
import { StreamingService, EStreamingState } from 'services/streaming';
import Utils from './utils';
import electron from 'electron';

const TB = electron.remote.TouchBar;

export class TouchBarService extends Service {
  @Inject() streamingService: StreamingService;

  goLiveButton: electron.TouchBarButton;
  liveTimer: electron.TouchBarLabel;

  init() {
    this.setupGoLive();

    const tb = new TB({
      items: [this.goLiveButton, this.liveTimer],
    });

    Utils.getMainWindow().setTouchBar(tb);
    Utils.getChildWindow().setTouchBar(tb);
  }

  setupGoLive() {
    this.goLiveButton = new TB.TouchBarButton({
      label: 'Go Live',
      backgroundColor: '#31C3A2',
      click: () => {
        this.streamingService.toggleStreaming();
      },
    });

    this.streamingService.streamingStatusChange.subscribe(status => {
      if (status === EStreamingState.Starting) {
        this.goLiveButton.label = 'Starting...';
        this.goLiveButton.backgroundColor = '#F85640';
      } else if (status === EStreamingState.Reconnecting) {
        this.goLiveButton.label = 'Reconnecting...';
        this.goLiveButton.backgroundColor = '#F85640';
      } else if (status === EStreamingState.Offline) {
        this.goLiveButton.label = 'Go Live';
        this.goLiveButton.backgroundColor = '#31C3A2';
      } else if (status === EStreamingState.Ending) {
        this.goLiveButton.label = 'Ending...';
        this.goLiveButton.backgroundColor = '#F85640';
      } else if (status === EStreamingState.Live) {
        this.goLiveButton.label = 'End Stream';
        this.goLiveButton.backgroundColor = '#F85640';
      }
    });

    this.liveTimer = new TB.TouchBarLabel({
      label: '',
    });

    window.setInterval(() => {
      if (this.streamingService.state.streamingStatus === EStreamingState.Live) {
        this.liveTimer.label = this.streamingService.formattedDurationInCurrentStreamingState;
      } else {
        this.liveTimer.label = '';
      }
    }, 500);
  }
}
