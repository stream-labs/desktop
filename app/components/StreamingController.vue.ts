import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Inject } from '../services/core/injector';
import { StreamingService, EStreamingState, EReplayBufferState } from '../services/streaming';
import StartStreamingButton from './StartStreamingButton.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';
import { UserService } from '../services/user';
import { CustomizationService } from 'services/customization';
import { $t } from 'services/i18n';
import { SettingsService } from 'services/settings';

@Component({
  components: {
    StartStreamingButton,
  },
})
export default class StudioFooterComponent extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() settingsService: SettingsService;

  @Prop() locked: boolean;

  toggleRecording() {
    this.streamingService.toggleRecording();
  }

  get recording() {
    return this.streamingService.isRecording;
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
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

  streamingElapsedTime: string = '--:--:--';
  @Watch('streamingStatus')
  updateStreamingElapsedTime(): void {
    if (this.streamingService.state.streamingStatus !== EStreamingState.Live) {
      this.streamingElapsedTime = '--:--:--';
      return;
    }

    this.streamingElapsedTime = this.streamingService.formattedDurationInCurrentStreamingState;

    setTimeout(() => this.updateStreamingElapsedTime(), 200);
  }

  recordTooltip = $t('streaming.recordTooltip');
  startReplayBufferTooltip = $t('streaming.startReplayBuffer');
  stopReplayBufferTooltip = $t('streaming.stopReplayBuffer');
  saveReplayTooltip = $t('streaming.saveReplay');
}
