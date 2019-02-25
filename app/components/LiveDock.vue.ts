import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import Chat from './Chat.vue';
import { StreamingService, EStreamingState } from '../services/streaming';
import { Inject } from '../util/injector';
import { StreamInfoService } from '../services/stream-info';
import { UserService } from '../services/user';
import { CustomizationService } from 'services/customization';
import electron from 'electron';
import { getPlatformService } from 'services/platforms';
import { YoutubeService } from 'services/platforms/youtube';
import { $t } from 'services/i18n';
import PlatformAppPageView from 'components/PlatformAppPageView.vue';
import { PlatformAppsService, EAppPageSlot, ILoadedApp } from 'services/platform-apps';
import ListInput from 'components/shared/inputs/ListInput.vue';
import ResizeBar from 'components/shared/ResizeBar.vue';
import { AppService } from 'services/app';
import Tabs, { ITab } from 'components/Tabs.vue';

@Component({
  components: {
    Chat,
    ListInput,
    PlatformAppPageView,
    ResizeBar,
    Tabs,
  },
})
export default class LiveDock extends Vue {
  @Inject() streamingService: StreamingService;
  @Inject() streamInfoService: StreamInfoService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() appService: AppService;

  @Prop({ default: false })
  onLeft: boolean;

  elapsedStreamTime = '';
  elapsedInterval: number;
  canAnimate = false;

  $refs: {
    chat: Chat;
  };

  slot = EAppPageSlot.Chat;

  // Safe getter/setter prevents getting stuck on the chat
  // for an app that was unloaded.
  underlyingSelectedChat = 'default';

  get selectedChat() {
    return this.chatApps.find(app => app.id === this.underlyingSelectedChat)
      ? this.underlyingSelectedChat
      : 'default';
  }

  set selectedChat(val: string) {
    this.underlyingSelectedChat = val;
  }

  viewStreamTooltip = $t('Go to Youtube to view your live stream');
  editStreamInfoTooltip = $t('Edit your stream title and description');
  controlRoomTooltip = $t('Go to Youtube Live Dashboard to control your stream');

  get liveDockStyles() {
    return {
      position: this.collapsed ? 'absolute' : 'static',
      left: this.collapsed ? '10000px' : 'auto',
    };
  }

  mounted() {
    const width = this.customizationService.state.livedockSize;
    if (width < 1) {
      // migrate from old percentage value to the pixel value
      this.resetWidth();
    }
    this.elapsedInterval = window.setInterval(() => {
      if (this.streamingStatus === EStreamingState.Live) {
        this.elapsedStreamTime = this.getElapsedStreamTime();
      } else {
        this.elapsedStreamTime = '';
      }
      this.updateWidth();
    }, 100);
  }

  get applicationLoading() {
    return this.appService.state.loading;
  }

  beforeDestroy() {
    clearInterval(this.elapsedInterval);
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  @Watch('streamingStatus')
  onStreamingStatusChange() {
    if (this.streamingStatus === EStreamingState.Starting) {
      this.expand();
    }
  }

  getElapsedStreamTime() {
    return this.streamingService.formattedDurationInCurrentStreamingState;
  }

  get collapsed() {
    return this.customizationService.state.livedockCollapsed;
  }

  collapse() {
    this.canAnimate = true;
    this.customizationService.setLiveDockCollapsed(true);
    setTimeout(() => (this.canAnimate = false), 300);
  }

  expand() {
    this.canAnimate = true;
    this.customizationService.setLiveDockCollapsed(false);
    setTimeout(() => (this.canAnimate = false), 300);
  }

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  get liveText() {
    if (this.streamingStatus === EStreamingState.Live) return 'Live';
    if (this.streamingStatus === EStreamingState.Starting) return 'Starting';
    if (this.streamingStatus === EStreamingState.Ending) return 'Ending';
    if (this.streamingStatus === EStreamingState.Reconnecting) return 'Reconnecting';
    return 'Offline';
  }

  get viewerCount() {
    if (this.hideViewerCount) {
      return 'viewers hidden';
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
    const youtubeDomain =
      nightMode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
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

  get isMixer() {
    return this.userService.platform.type === 'mixer';
  }

  get isYoutube() {
    return this.userService.platform.type === 'youtube';
  }

  get isFacebook() {
    return this.userService.platform.type === 'facebook';
  }

  get hideViewerCount() {
    return this.customizationService.state.hideViewerCount;
  }

  get liveDockSize() {
    return this.customizationService.state.livedockSize;
  }

  toggleViewerCount() {
    this.customizationService.setHiddenViewerCount(
      !this.customizationService.state.hideViewerCount,
    );
  }

  refreshChat() {
    if (!this.showDefaultPlatformChat) {
      this.platformAppsService.refreshApp(this.selectedChat);
      return;
    }
    this.$refs.chat.refresh();
  }

  get hasChatApps() {
    return this.chatApps.length > 0;
  }

  get showDefaultPlatformChat() {
    return this.selectedChat === 'default';
  }

  get chatApps(): ILoadedApp[] {
    return this.platformAppsService.enabledApps.filter(app => {
      return !!app.manifest.pages.find(page => {
        return page.slot === EAppPageSlot.Chat;
      });
    });
  }

  get chatTabs(): ITab[] {
    return [
      {
        name: this.userService.platform.type.toString(),
        value: 'default',
      },
    ].concat(
      this.chatApps
        .filter(app => !app.poppedOutSlots.includes(this.slot))
        .map(app => {
          return {
            name: app.manifest.name,
            value: app.id,
          };
        }),
    );
  }

  get isPopOutAllowed() {
    if (this.showDefaultPlatformChat) return false;

    const chatPage = this.platformAppsService
      .getApp(this.selectedChat)
      .manifest.pages.find(page => page.slot === EAppPageSlot.Chat);
    if (!chatPage) return false;

    // Default result is true
    return chatPage.allowPopout == null ? true : chatPage.allowPopout;
  }

  popOut() {
    this.platformAppsService.popOutAppPage(this.selectedChat, this.slot);
    this.selectedChat = 'default';
  }

  get defaultChatStyles() {
    if (this.selectedChat === 'default') {
      return {};
    }

    return {
      position: 'absolute',
      top: '-10000px',
    };
  }

  onResizeStartHandler() {
    this.customizationService.setSettings({ previewEnabled: false });
  }

  onResizeStopHandler(offset: number) {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    offset = this.onLeft ? offset : -offset;
    this.setWidth(this.customizationService.state.livedockSize + offset);
    setTimeout(() => {
      this.customizationService.setSettings({
        previewEnabled: true,
      });
    }, 500);
  }

  setWidth(width: number) {
    this.customizationService.setSettings({
      livedockSize: this.validateWidth(width),
    });
  }

  validateWidth(width: number): number {
    const appRect = this.$root.$el.getBoundingClientRect();
    const minEditorWidth = 860;
    const minWidth = 290;
    const maxWidth = Math.min(appRect.width - minEditorWidth, appRect.width / 2);
    // tslint:disable-next-line:no-parameter-reassignment TODO
    width = Math.max(minWidth, width);
    // tslint:disable-next-line:no-parameter-reassignment
    width = Math.min(maxWidth, width);
    return width;
  }

  updateWidth() {
    const width = this.customizationService.state.livedockSize;
    if (width !== this.validateWidth(width)) this.setWidth(width);
  }

  resetWidth() {
    const appRect = this.$root.$el.getBoundingClientRect();
    const defaultWidth = appRect.width * 0.28;
    this.setWidth(defaultWidth);
  }
}
