import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import Chat from './Chat.vue';
import { StreamingService } from '../services/streaming';
import { Inject } from '../util/injector';
import { StreamInfoService } from '../services/stream-info';
import { UserService } from '../services/user';
import { Subscription } from 'rxjs/Subscription';
import { CustomizationService } from 'services/customization';
import Slider from './shared/Slider.vue';

@Component({
  components: {
    Chat,
    Slider
  }
})
export default class LiveDock extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() streamInfoService: StreamInfoService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  @Prop({ default: false })
  onLeft: boolean;

  elapsedStreamTime = '';
  elapsedInterval: number;

  subscription: Subscription;

  $refs: {
    chat: Chat;
  };

  mounted() {
    this.elapsedInterval = window.setInterval(() => {
      if (this.streamingService.isStreaming) {
        this.elapsedStreamTime = this.getElapsedStreamTime();
      } else {
        this.elapsedStreamTime = '';
      }
    }, 100);

    this.subscription = this.streamingService.streamingStateChange.subscribe(
      status => {
        if (status.isStreaming) this.expand();
      }
    );
  }

  beforeDestroy() {
    clearInterval(this.elapsedInterval);
    this.subscription.unsubscribe();
  }

  getElapsedStreamTime() {
    return this.streamingService.formattedElapsedStreamTime;
  }

  get collapsed() {
    return this.customizationService.state.livedockCollapsed;
  }

  collapse() {
    this.customizationService.setLiveDockCollapsed(true);
  }

  expand() {
    this.customizationService.setLiveDockCollapsed(false);
  }

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  get liveText() {
    return this.isStreaming ? 'LIVE' : 'OFFLINE';
  }

  get viewerCount() {
    if (this.hideViewerCount) {
      return '?';
    }

    return this.streamInfoService.state.viewerCount.toString();
  }

  showEditStreamInfo() {
    this.streamingService.showEditStreamInfo();
  }

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }

  get hideViewerCount() {
    return this.customizationService.state.hideViewerCount;
  }

  get liveDockSize () {
    return this.customizationService.state.livedockSize;
  }

  set liveDockSize (livedockSize) {
    this.customizationService.setSettings({ livedockSize });
  }

  toggleViewerCount() {
    this.customizationService.setHiddenViewerCount(
      !this.customizationService.state.hideViewerCount
    );
  }

  refreshChat() {
    this.$refs.chat.refresh();
  }
}
