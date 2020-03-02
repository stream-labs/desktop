import { Service, Inject } from 'services/core';
import { StreamingService, EStreamingState } from 'services/streaming';
import Utils from './utils';
import electron from 'electron';
import { NavigationService } from './navigation';
import { AppService } from './app';

const TB = electron.remote.TouchBar;

export class TouchBarService extends Service {
  @Inject() streamingService: StreamingService;
  @Inject() navigationService: NavigationService;
  @Inject() appService: AppService;

  goLiveButton: electron.TouchBarButton;
  liveTimer: electron.TouchBarLabel;

  mainTb: electron.TouchBar;
  blankTb: electron.TouchBar;

  init() {
    this.setupGoLive();

    this.mainTb = new TB({
      items: [this.goLiveButton, this.liveTimer],
    });

    this.blankTb = new TB({ items: [] });

    this.setTb();

    this.navigationService.navigated.subscribe(() => this.setTb());
    this.appService.loadingChanged.subscribe(() => this.setTb());
  }

  setTb() {
    if (
      this.navigationService.state.currentPage === 'Onboarding' ||
      this.appService.state.loading
    ) {
      Utils.getMainWindow().setTouchBar(this.blankTb);
      Utils.getChildWindow().setTouchBar(this.blankTb);
    } else {
      Utils.getMainWindow().setTouchBar(this.mainTb);
      Utils.getChildWindow().setTouchBar(this.mainTb);
    }
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
