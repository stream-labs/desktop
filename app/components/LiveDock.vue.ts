import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import Chat from './Chat.vue';
import StreamingService from '../services/streaming';
import { Inject } from '../util/injector';
import PerformanceMetricsStream from './PerformanceMetricsStream.vue';
import { StreamInfoService } from '../services/stream-info';
import { UserService } from '../services/user';

@Component({
  components: {
    Chat,
    PerformanceMetricsStream,
  }
})
export default class LiveDock extends Vue {

  @Inject() streamingService: StreamingService;
  @Inject() streamInfoService: StreamInfoService;
  @Inject() userService: UserService;

  elapsedStreamTime = '';
  elapsedInterval: number;

  collapsed = false;

  mounted() {
    this.elapsedInterval = window.setInterval(
      () => {
        if (this.streamingService.isStreaming) {
          this.elapsedStreamTime = this.getElapsedStreamTime();
        }
      },
      100
    );
  }

  beforeDestroy() {
    clearInterval(this.elapsedInterval);
  }

  getElapsedStreamTime() {
    return this.streamingService.formattedElapsedStreamTime;
  }

  collapse() {
    this.collapsed = true;
  }

  expand() {
    this.collapsed = false;
  }

  get viewerCount() {
    return this.streamInfoService.state.viewerCount;
  }

  showEditStreamInfo() {
    this.streamingService.showEditStreamInfo();
  }

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }

}
