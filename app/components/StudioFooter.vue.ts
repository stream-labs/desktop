import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from '../services/core/injector';
import { StreamingService, EReplayBufferState, EStreamingState } from '../services/streaming';
import StartStreamingButton from './StartStreamingButton.vue';
import TestWidgets from './TestWidgets.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';
import NotificationsArea from './NotificationsArea.vue';
import { UserService } from '../services/user';
import { getPlatformService } from 'services/platforms';
import { YoutubeService } from 'services/platforms/youtube';
import { PerformanceService, EStreamQuality } from 'services/performance';
import electron from 'electron';
import { CustomizationService } from 'services/customization';
import { WindowsService } from 'services/windows';
import { $t } from 'services/i18n';
import { SettingsService } from 'services/settings';

@Component({
  components: {
    StartStreamingButton,
    TestWidgets,
    PerformanceMetrics,
    NotificationsArea,
  },
})
export default class StudioFooterComponent extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() windowsService: WindowsService;
  @Inject() settingsService: SettingsService;
  @Inject() performanceService: PerformanceService;

  @Prop() locked: boolean;

  metricsShown = false;
  recordingTime = '';
  private recordingTimeIntervalId: number;

  mounted() {
    this.confirmYoutubeEnabled();

    // update recording time
    this.recordingTimeIntervalId = window.setInterval(() => {
      if (!this.streamingService.isRecording) return;
      this.recordingTime = this.streamingService.formattedDurationInCurrentRecordingState;
    }, 1000);
  }

  destroyed() {
    clearInterval(this.recordingTimeIntervalId);
  }

  toggleRecording() {
    this.streamingService.toggleRecording();
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  get performanceIconClassName() {
    if (!this.streamingStatus || this.streamingStatus === EStreamingState.Offline) {
      return '';
    }

    if (
      this.streamingStatus === EStreamingState.Reconnecting ||
      this.performanceService.streamQuality === EStreamQuality.POOR
    ) {
      return 'warning';
    }

    if (this.performanceService.streamQuality === EStreamQuality.FAIR) {
      return 'info';
    }

    return 'success';
  }

  get mediaBackupOptOut() {
    return this.customizationService.state.mediaBackupOptOut;
  }

  get recording() {
    return this.streamingService.isRecording;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get canSchedule() {
    return (
      this.userService.platform && ['facebook', 'youtube'].includes(this.userService.platform.type)
    );
  }

  get youtubeEnabled() {
    if (this.userService.platform) {
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);
      if (service instanceof YoutubeService) {
        return service.state.liveStreamingEnabled;
      }
    }
    return true;
  }

  openYoutubeEnable() {
    electron.remote.shell.openExternal('https://youtube.com/live_dashboard_splash');
  }

  openScheduleStream() {
    this.windowsService.showWindow({
      componentName: 'EditStreamInfo',
      title: $t('Schedule Stream'),
      queryParams: { isSchedule: true },
      size: { width: 500, height: 670 },
    });
  }

  confirmYoutubeEnabled() {
    if (this.userService.platform) {
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);
      if (service instanceof YoutubeService) {
        service.prepopulateInfo();
      }
    }
  }

  openMetricsWindow() {
    this.windowsService.showWindow({
      componentName: 'AdvancedStatistics',
      title: $t('Performance Metrics'),
      size: { width: 700, height: 550 },
      resizable: true,
      maximizable: false,
      minWidth: 500,
      minHeight: 400,
    });
  }

  get replayBufferEnabled() {
    return this.settingsService.state.Output.RecRB;
  }

  get replayBufferOffline() {
    return this.streamingService.state.replayBufferStatus === EReplayBufferState.Offline;
  }

  get replayBufferStopping() {
    return this.streamingService.state.replayBufferStatus === EReplayBufferState.Stopping;
  }

  get replayBufferSaving() {
    return this.streamingService.state.replayBufferStatus === EReplayBufferState.Saving;
  }

  toggleReplayBuffer() {
    if (this.streamingService.state.replayBufferStatus === EReplayBufferState.Offline) {
      this.streamingService.startReplayBuffer();
    } else {
      this.streamingService.stopReplayBuffer();
    }
  }

  saveReplay() {
    this.streamingService.saveReplay();
  }
}
