import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { StreamingService } from '../services/streaming';
import { Inject } from '../util/injector';
import { NavigationService } from '../services/navigation';
import { UserService } from '../services/user';
import { CustomizationService } from '../services/customization';

@Component({})
export default class StartStreamingButton extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;

  @Prop() disabled: boolean;

  toggleStreaming() {
    if (this.streamingService.isStreaming) {
      this.streamingService.stopStreaming();
    } else if (this.streamingService.delaySecondsRemaining) {
      this.streamingService.discardStreamDelay();
    } else {
      if (
        this.userService.isLoggedIn() &&
        this.customizationService.state.updateStreamInfoOnLive &&
        (this.userService.platform.type === 'twitch' ||
        this.userService.platform.type === 'mixer')
      ) {
        this.streamingService.showEditStreamInfo();
      } else {
        this.streamingService.startStreaming();
        if (this.userService.isLoggedIn()) {
          this.navigationService.navigate('Live');
        }
      }
    }
  }

  getStreamButtonLabel() {
    if (this.streamingService.isStreaming) {
      const delaySeconds = this.streamingService.delaySecondsRemaining;

      if (delaySeconds) {
        return `STARTING ${delaySeconds}s`;
      }

      return 'END STREAM';
    }

    const delaySeconds = this.streamingService.delaySecondsRemaining;

    if (delaySeconds) {
      return `DISCARD ${delaySeconds}s`;
    }

    return 'GO LIVE';
  }

  getIsRedButton() {
    return this.isStreaming || this.streamingService.delaySecondsRemaining;
  }

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  @Watch('isStreaming')
  setDelayUpdate() {
    console.log('force update');
    this.$forceUpdate();

    if (this.streamingService.delaySecondsRemaining) {
      setTimeout(() => this.setDelayUpdate(), 100);
    }
  }
}
