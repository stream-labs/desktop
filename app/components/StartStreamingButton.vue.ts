import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { StreamingService, EStreamingState } from 'services/streaming';
import { Inject } from 'util/injector';
import { NavigationService } from 'services/navigation';
import { UserService } from 'services/user';
import { CustomizationService } from 'services/customization';
import { MediaBackupService, EGlobalSyncStatus } from 'services/media-backup';
import electron from 'electron';

@Component({})
export default class StartStreamingButton extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;
  @Inject() mediaBackupService: MediaBackupService;

  @Prop() disabled: boolean;

  async toggleStreaming() {
    if (this.streamingService.isStreaming) {
      this.streamingService.toggleStreaming();
    } else {
      if (this.mediaBackupService.globalSyncStatus === EGlobalSyncStatus.Syncing) {
        const goLive = await new Promise<boolean>(resolve => {
          electron.remote.dialog.showMessageBox(
            electron.remote.getCurrentWindow(),
            {
              title: 'Cloud Backup',
              type: 'warning',
              message: 'Your media files are currently being synced with the cloud. ' +
                'It is recommended that you wait until this finishes before going live.',
              buttons: ['Wait', 'Go Live Anyway']
            },
            goLive => {
              resolve(!!goLive);
            }
          );
        });

        if (!goLive) return;
      }

      if (
        this.userService.isLoggedIn() &&
        this.customizationService.state.updateStreamInfoOnLive &&
        (this.userService.platform.type === 'twitch' ||
        this.userService.platform.type === 'mixer')
      ) {
        this.streamingService.showEditStreamInfo();
      } else {
        this.streamingService.toggleStreaming();
        if (this.userService.isLoggedIn()) {
          this.navigationService.navigate('Live');
        }
      }
    }
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  getStreamButtonLabel() {
    if (this.streamingStatus === EStreamingState.Live) {
      return 'END STREAM';
    }

    if (this.streamingStatus === EStreamingState.Starting) {
      if (this.streamingService.delayEnabled) {
        return `STARTING ${this.streamingService.delaySecondsRemaining}s`;
      }

      return 'STARTING';
    }

    if (this.streamingStatus === EStreamingState.Ending) {
      if (this.streamingService.delayEnabled) {
        return `DISCARD ${this.streamingService.delaySecondsRemaining}s`;
      }

      return 'ENDING';
    }

    if (this.streamingStatus === EStreamingState.Reconnecting) {
      return 'RECONNECTING';
    }

    return 'GO LIVE';
  }

  getIsRedButton() {
    return this.streamingStatus !== EStreamingState.Offline;
  }

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  get isDisabled() {
    return this.disabled ||
      ((this.streamingStatus === EStreamingState.Starting) && (this.streamingService.delaySecondsRemaining === 0)) ||
      ((this.streamingStatus === EStreamingState.Ending) && (this.streamingService.delaySecondsRemaining === 0));
  }

  @Watch('streamingStatus')
  setDelayUpdate() {
    this.$forceUpdate();

    if (this.streamingService.delaySecondsRemaining) {
      setTimeout(() => this.setDelayUpdate(), 100);
    }
  }
}
