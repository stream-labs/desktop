import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Chat from './Chat.vue';
import StreamingService from '../services/streaming';
import { Inject } from '../util/injector';
import { StreamInfoService } from '../services/stream-info';
import { UserService } from '../services/user';
import { Subscription } from 'rxjs/Subscription';

@Component({
  components: {
    Chat,
  }
})
export default class LiveDock extends Vue {

  @Inject() streamingService: StreamingService;
  @Inject() streamInfoService: StreamInfoService;
  @Inject() userService: UserService;

  @Prop({ default: false }) onLeft: boolean;

  elapsedStreamTime = '';
  elapsedInterval: number;

  collapsed = true;

  subscription: Subscription;

  mounted() {
    this.elapsedInterval = window.setInterval(
      () => {
        if (this.streamingService.isStreaming) {
          this.elapsedStreamTime = this.getElapsedStreamTime();
        } else {
          this.elapsedStreamTime = '';
        }
      },
      100
    );

    this.subscription = this.streamingService.streamingStatusChange.subscribe(status => {
      if (status) this.collapsed = false;
    });
  }

  beforeDestroy() {
    clearInterval(this.elapsedInterval);
    this.subscription.unsubscribe();
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

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  get liveText() {
    return this.isStreaming ? 'LIVE' : 'OFFLINE';
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
