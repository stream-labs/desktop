import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
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
    } else {
      if (
        this.userService.isLoggedIn() &&
        this.customizationService.state.updateStreamInfoOnLive &&
        this.userService.platform.type === 'twitch'
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

  get streamButtonLabel() {
    if (this.streamingService.isStreaming) {
      return 'End Stream';
    }

    return 'Go Live';
  }
}
