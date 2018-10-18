import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { StreamingService } from '../services/streaming';
import StartStreamingButton from './StartStreamingButton.vue';
import TestWidgets from './TestWidgets.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';
import NotificationsArea from './NotificationsArea.vue';
import { UserService } from '../services/user';
import { getPlatformService } from 'services/platforms';
import { YoutubeService } from 'services/platforms/youtube';
import electron from 'electron';
import GlobalSyncStatus from 'components/GlobalSyncStatus.vue';
import { CustomizationService } from 'services/customization';
import { $t } from 'services/i18n';

@Component({
  components: {
    StartStreamingButton,
    TestWidgets,
    PerformanceMetrics,
    NotificationsArea,
    GlobalSyncStatus
  }
})
export default class StudioFooterComponent extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  @Prop() locked: boolean;

  mounted() {
    this.confirmYoutubeEnabled();
  }

  toggleRecording() {
    this.streamingService.toggleRecording();
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
    electron.remote.shell.openExternal(
      'https://youtube.com/live_dashboard_splash'
    );
  }

  confirmYoutubeEnabled() {
    if (this.userService.platform) {
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);
      if (service instanceof YoutubeService) {
        service.verifyAbleToStream();
      }
    }
  }
}
