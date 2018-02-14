import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { StreamingService } from '../services/streaming';
import StartStreamingButton from './StartStreamingButton.vue';
import TestWidgets from './TestWidgets.vue';
import PerformanceMetrics from './PerformanceMetrics.vue';
import NotificationsArea from './NotificationsArea.vue';
import { UserService } from '../services/user';
import { VTooltip, VPopover, VClosePopover } from 'v-tooltip';

Vue.directive('tooltip', VTooltip)
Vue.directive('close-popover', VClosePopover)
Vue.component('v-popover', VPopover)

@Component({
  components: {
    StartStreamingButton,
    TestWidgets,
    PerformanceMetrics,
    NotificationsArea,
  }
})
export default class StudioFooterComponent extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() userService: UserService;

  @Prop() locked: boolean;

  recordButtonTooltip = "The record feature can be used while you are live or on it's own. Find your recordings in Settings -> Output";

  toggleRecording() {
    if (this.recording) {
      this.streamingService.stopRecording();
    } else {
      this.streamingService.startRecording();
    }
  }

  get recording() {
    return this.streamingService.isRecording;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }
}
