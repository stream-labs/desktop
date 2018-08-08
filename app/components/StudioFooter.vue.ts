import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { StreamingService } from '../services/streaming';
import StartStreamingButton from './StartStreamingButton.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';
import NotificationsArea from './NotificationsArea.vue';
import { UserService } from '../services/user';
import { getPlatformService } from 'services/platforms';
import electron from 'electron';
import { CustomizationService } from 'services/customization';
import { $t } from 'services/i18n';

@Component({
  components: {
    StartStreamingButton,
    PerformanceMetrics,
    NotificationsArea,
  }
})
export default class StudioFooterComponent extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  @Prop() locked: boolean;

  toggleRecording() {
    this.streamingService.toggleRecording();
  }

  get recording() {
    return this.streamingService.isRecording;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  recordTooltip = $t('streaming.recordTooltip');
}
