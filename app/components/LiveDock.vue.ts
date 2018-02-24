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
import electron from 'electron';
import { getPlatformService } from 'services/platforms';
import { YoutubeService } from 'services/platforms/youtube';


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
      if (this.streamingService.isLive) {
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

  get isLive() {
    return this.streamingService.isLive;
  }

  get liveText() {
    if (this.isLive) return 'LIVE';
    if (this.isStreaming) return 'STARTING';
    return 'OFFLINE';
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

  openYoutubeStreamUrl() {
    const platform = this.userService.platform.type;
    const service = getPlatformService(platform);
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';
    const youtubeDomain = nightMode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
    if (service instanceof YoutubeService) {
      const url = `${youtubeDomain}/channel/${service.youtubeId}/live`;
      electron.remote.shell.openExternal(url);
    }
  }

  openYoutubeControlRoom() {
    electron.remote.shell.openExternal('https://www.youtube.com/live_dashboard');
  }

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }

  get isYoutube() {
    return this.userService.platform.type === 'youtube';
  }

  get hideViewerCount() {
    return this.customizationService.state.hideViewerCount;
  }

  get liveDockSize () {
    return this.customizationService.state.livedockSize;
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
