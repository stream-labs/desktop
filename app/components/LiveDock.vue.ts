import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import Chat from './Chat.vue';
import { StreamingService, EStreamingState } from '../services/streaming';
import { Inject } from '../services/core/injector';
import { StreamInfoService } from '../services/stream-info';
import { UserService } from '../services/user';
import { CustomizationService } from 'services/customization';
import electron from 'electron';
import { $t } from 'services/i18n';
import PlatformAppPageView from 'components/PlatformAppPageView.vue';
import { PlatformAppsService, EAppPageSlot, ILoadedApp } from 'services/platform-apps';
import ListInput from 'components/shared/inputs/ListInput.vue';
import { AppService } from 'services/app';
import Tabs, { ITab } from 'components/Tabs.vue';
import { ChatService } from 'services/chat';
import { WindowsService } from 'services/windows';
import { RestreamService } from 'app-services';

@Component({
  components: {
    Chat,
    ListInput,
    PlatformAppPageView,
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
  @Inject() chatService: ChatService;
  @Inject() windowsService: WindowsService;
  @Inject() restreamService: RestreamService;

  @Prop({ default: false })
  onLeft: boolean;

  elapsedStreamTime = '';
  elapsedInterval: number;
  canAnimate = false;

  slot = EAppPageSlot.Chat;

  // Safe getter/setter prevents getting stuck on the chat
  // for an app that was unloaded.
  underlyingSelectedChat = 'default';

  get selectedChat() {
    if (this.underlyingSelectedChat === 'default') return 'default';
    if (this.underlyingSelectedChat === 'restream') {
      if (this.restreamService.shouldGoLiveWithRestream) return 'restream';
      return 'default';
    }

    return this.chatApps.find(app => app.id === this.underlyingSelectedChat)
      ? this.underlyingSelectedChat
      : 'default';
  }

  set selectedChat(val: string) {
    this.underlyingSelectedChat = val;
  }

  viewStreamTooltip = $t('Go to Youtube to view your live stream');
  editStreamInfoTooltip = $t('Edit your stream title and description');
  controlRoomTooltip = $t('Go to Youtube Live Dashboard');

  mounted() {
    this.elapsedInterval = window.setInterval(() => {
      if (this.streamingStatus === EStreamingState.Live) {
        this.elapsedStreamTime = this.getElapsedStreamTime();
      } else {
        this.elapsedStreamTime = '';
      }
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
      this.setCollapsed(false);
    }
  }

  getElapsedStreamTime() {
    return this.streamingService.formattedDurationInCurrentStreamingState;
  }

  get collapsed() {
    return this.customizationService.state.livedockCollapsed;
  }

  setCollapsed(livedockCollapsed: boolean) {
    this.canAnimate = true;
    this.windowsService.updateStyleBlockers('main', true);
    this.customizationService.setSettings({ livedockCollapsed });
    setTimeout(() => {
      this.canAnimate = false;
      this.windowsService.updateStyleBlockers('main', false);
    }, 300);
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

  get offlineImageSrc() {
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    return require(`../../media/images/sleeping-kevin-${mode}.png`);
  }

  showEditStreamInfo() {
    if (!this.isStreaming && this.restreamService.shouldGoLiveWithRestream) {
      this.streamingService.showEditStreamInfo(this.restreamService.platforms, 0);
    } else {
      this.streamingService.showEditStreamInfo();
    }
  }

  openYoutubeStreamUrl() {
    electron.remote.shell.openExternal(this.streamInfoService.state.streamUrl);
  }

  openYoutubeControlRoom() {
    electron.remote.shell.openExternal(this.streamInfoService.state.dashboardUrl);
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
    if (this.selectedChat === 'default') {
      this.chatService.refreshChat();
      return;
    }

    if (this.selectedChat === 'restream') {
      this.restreamService.refreshChat();
      return;
    }

    this.platformAppsService.refreshApp(this.selectedChat);
  }

  get hideStyleBlockers() {
    return this.windowsService.state.main.hideStyleBlockers;
  }

  get hasChatTabs() {
    return this.chatTabs.length > 1;
  }

  get showDefaultPlatformChat() {
    return this.selectedChat === 'default';
  }

  get restreamChatUrl() {
    return this.restreamService.chatUrl;
  }

  get chatApps(): ILoadedApp[] {
    return this.platformAppsService.enabledApps.filter(app => {
      return !!app.manifest.pages.find(page => {
        return page.slot === EAppPageSlot.Chat;
      });
    });
  }

  get chatTabs(): ITab[] {
    const tabs: ITab[] = [
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

    if (this.restreamService.shouldGoLiveWithRestream) {
      tabs.push({
        name: $t('Multistream'),
        value: 'restream',
      });
    }

    return tabs;
  }

  get isPopOutAllowed() {
    if (this.showDefaultPlatformChat) return false;
    if (this.selectedChat === 'restream') return false;

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
}
