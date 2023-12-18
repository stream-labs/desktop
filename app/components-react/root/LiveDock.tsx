import React, { useEffect, useMemo } from 'react';
import * as remote from '@electron/remote';
import cx from 'classnames';
import Animation from 'rc-animate';
import { Menu } from 'antd';
import { initStore, useController } from 'components-react/hooks/zustand';
import { EStreamingState } from 'services/streaming';
import { EAppPageSlot, ILoadedApp } from 'services/platform-apps';
import { TPlatform, getPlatformService } from 'services/platforms';
import { $t } from 'services/i18n';
import { Services } from '../service-provider';
import Chat from './Chat';
import styles from './LiveDock.m.less';
import Tooltip from 'components-react/shared/Tooltip';
import PlatformAppPageView from 'components-react/shared/PlatformAppPageView';

const LiveDockCtx = React.createContext<LiveDockController | null>(null);

class LiveDockController {
  private streamingService = Services.StreamingService;
  private youtubeService = Services.YoutubeService;
  private facebookService = Services.FacebookService;
  private trovoService = Services.TrovoService;
  private userService = Services.UserService;
  private customizationService = Services.CustomizationService;
  private platformAppsService = Services.PlatformAppsService;
  private appService = Services.AppService;
  private chatService = Services.ChatService;
  private windowsService = Services.WindowsService;
  private restreamService = Services.RestreamService;

  store = initStore({
    elapsedStreamTime: '',
    canAnimate: false,
    slot: EAppPageSlot.Chat,
    underlyingSelectedChat: 'default',
  });

  // Safe getter/setter prevents getting stuck on the chat
  // for an app that was unloaded.
  setChat(key: string) {
    this.store.setState(s => (s.underlyingSelectedChat = key));
  }

  get selectedChat() {
    if (
      this.store.underlyingSelectedChat === 'default' &&
      this.isPlatform('twitter') &&
      this.isRestreaming
    ) {
      return 'restream';
    }
    if (this.store.underlyingSelectedChat === 'default') return 'default';
    if (this.store.underlyingSelectedChat === 'restream') {
      if (this.restreamService.shouldGoLiveWithRestream) return 'restream';
      return 'default';
    }
    return this.chatApps.find(app => app.id === this.store.underlyingSelectedChat)
      ? this.store.underlyingSelectedChat
      : 'default';
  }

  get applicationLoading() {
    return this.appService.state.loading;
  }

  get streamingStatus() {
    return this.streamingService.state.streamingStatus;
  }

  get isStreaming() {
    return this.streamingService.isStreaming;
  }

  get collapsed() {
    return this.customizationService.state.livedockCollapsed;
  }

  get liveText() {
    if (this.streamingStatus === EStreamingState.Live) return 'Live';
    if (this.streamingStatus === EStreamingState.Starting) return 'Starting';
    if (this.streamingStatus === EStreamingState.Ending) return 'Ending';
    if (this.streamingStatus === EStreamingState.Reconnecting) return 'Reconnecting';
    return 'Offline';
  }

  get platform() {
    return this.userService.platform?.type;
  }

  get offlineImageSrc() {
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    return require(`../../../media/images/sleeping-kevin-${mode}.png`);
  }

  get hideViewerCount() {
    return this.customizationService.state.hideViewerCount;
  }

  get liveDockSize() {
    return this.customizationService.state.livedockSize;
  }

  get viewerCount() {
    if (this.hideViewerCount) {
      return 'viewers hidden';
    }
    return this.streamingService.views.viewerCount.toString();
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

  get chatTabs(): { name: string; value: string }[] {
    if (!this.userService.state.auth) return [];
    const tabs: { name: string; value: string }[] = [
      {
        name: getPlatformService(this.userService.state.auth.primaryPlatform).displayName,
        value: 'default',
      },
    ].concat(
      this.chatApps
        .filter(app => !app.poppedOutSlots.includes(this.store.slot))
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
    if (this.userService.state.auth.primaryPlatform === 'twitter') {
      // Twitter is the only primary platform without a chat
      return tabs.slice(1);
    }
    return tabs;
  }

  get isRestreaming() {
    return this.restreamService.shouldGoLiveWithRestream;
  }

  get isPopOutAllowed() {
    if (this.showDefaultPlatformChat) return false;
    if (this.selectedChat === 'restream') return false;
    const chatPage = this.platformAppsService.views
      .getApp(this.selectedChat)
      .manifest.pages.find(page => page.slot === EAppPageSlot.Chat);
    if (!chatPage) return false;
    // Default result is true
    return chatPage.allowPopout == null ? true : chatPage.allowPopout;
  }

  get canEditChannelInfo(): boolean {
    // Twitter doesn't support editing title after going live
    if (this.isPlatform('twitter') && !this.isRestreaming) return false;
    return (
      this.streamingService.views.isMidStreamMode ||
      this.userService.state.auth?.primaryPlatform === 'twitch'
    );
  }

  getElapsedStreamTime() {
    return this.streamingService.formattedDurationInCurrentStreamingState;
  }

  isPlatform(platforms: TPlatform | TPlatform[]) {
    if (!this.platform) return false;
    if (Array.isArray(platforms)) return platforms.includes(this.platform);
    return this.platform === platforms;
  }

  openPlatformStream() {
    let url = '';
    if (this.platform === 'youtube') url = this.youtubeService.streamPageUrl;
    if (this.platform === 'facebook') url = this.facebookService.streamPageUrl;
    if (this.platform === 'trovo') url = this.trovoService.streamPageUrl;
    remote.shell.openExternal(url);
  }

  openPlatformDash() {
    let url = '';
    if (this.platform === 'youtube') url = this.youtubeService.dashboardUrl;
    if (this.platform === 'facebook') url = this.facebookService.streamDashboardUrl;
    remote.shell.openExternal(url);
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

  popOut() {
    this.platformAppsService.popOutAppPage(this.selectedChat, this.store.slot);
    this.setChat('default');
  }

  setCollapsed(livedockCollapsed: boolean) {
    this.store.setState(s => {
      s.canAnimate = true;
    });
    this.windowsService.actions.updateStyleBlockers('main', true);
    this.customizationService.actions.setSettings({ livedockCollapsed });
    setTimeout(() => {
      this.store.setState(s => {
        s.canAnimate = false;
      });
      this.windowsService.actions.updateStyleBlockers('main', false);
    }, 300);
  }

  toggleViewerCount() {
    this.customizationService.setHiddenViewerCount(
      !this.customizationService.state.hideViewerCount,
    );
  }

  showEditStreamInfo() {
    this.streamingService.actions.showEditStream();
  }
}

export default function LiveDockWithContext(p: { onLeft?: boolean }) {
  const controller = useMemo(() => new LiveDockController(), []);
  return (
    <LiveDockCtx.Provider value={controller}>
      <LiveDock onLeft />
    </LiveDockCtx.Provider>
  );
}

function LiveDock(p: { onLeft: boolean } = { onLeft: false }) {
  const ctrl = useController(LiveDockCtx);

  useEffect(() => {
    const elapsedInterval = window.setInterval(() => {
      if (ctrl.streamingStatus === EStreamingState.Live) {
        ctrl.store.setState(s => {
          s.elapsedStreamTime = ctrl.getElapsedStreamTime();
        });
      } else {
        ctrl.store.setState(s => {
          s.elapsedStreamTime = '';
        });
      }
    }, 100);

    return () => clearInterval(elapsedInterval);
  }, []);

  useEffect(() => {
    if (ctrl.streamingStatus === EStreamingState.Starting && ctrl.collapsed) {
      ctrl.setCollapsed(false);
    }
  }, [ctrl.streamingStatus]);

  // controlRoomTooltip = $t('Go to YouTube Live Dashboard');
  // liveProducerTooltip = $t('Go to the Facebook Live Producer Dashboard');

  function toggleCollapsed() {
    ctrl.collapsed ? ctrl.setCollapsed(false) : ctrl.setCollapsed(true);
  }

  const { collapsed, isPlatform, isStreaming } = ctrl;

  return (
    <div
      className={cx(styles.liveDock, {
        [styles.canAnimate]: ctrl.store.canAnimate,
        [styles.liveDockLeft]: p.onLeft,
      })}
      style={{ width: ctrl.liveDockSize + 'px' }}
    >
      <div className={styles.liveDockChevron} onClick={toggleCollapsed}>
        <i
          className={cx({
            [styles.iconBack]: (!p.onLeft && collapsed) || (p.onLeft && !collapsed),
            [`${styles.iconDown} ${styles.iconRight}`]:
              (p.onLeft && collapsed) || (!p.onLeft && !collapsed),
          })}
        />
      </div>
      <Animation transitionName={p.onLeft ? 'ant-slide-right' : 'ant-slide-left'}>
        {!collapsed && (
          <div className={styles.liveDockExpandedContents}>
            <div className={styles.liveDockHeader}>
              <div className="flex flex--center">
                <div
                  className={cx(styles.liveDockPulse, {
                    [styles.liveDockOffline]: !isStreaming,
                  })}
                />
                <span className={styles.liveDockText}>{ctrl.liveText}</span>
                <span className={styles.liveDockTimer}>{ctrl.store.elapsedStreamTime}</span>
              </div>
              <div className={styles.liveDockViewerCount}>
                <i
                  className={cx({
                    [styles.iconView]: !ctrl.hideViewerCount,
                    [styles.iconHide]: ctrl.hideViewerCount,
                  })}
                  onClick={() => ctrl.toggleViewerCount()}
                />
                <span className={styles.liveDockViewerCountCount}>{ctrl.viewerCount}</span>
                {Number(ctrl.viewerCount) >= 0 && <span>{$t('viewers')}</span>}
              </div>
            </div>

            <div className={styles.liveDockInfo}>
              <div className={styles.liveDockPlatformTools}>
                {ctrl.canEditChannelInfo && (
                  <Tooltip title={$t('Edit your stream title and description')} placement="right">
                    <i onClick={() => ctrl.showEditStreamInfo()} className="icon-edit" />
                  </Tooltip>
                )}
                {isPlatform(['youtube', 'facebook', 'trovo']) && isStreaming && (
                  <Tooltip title={$t('View your live stream in a web browser')} placement="right">
                    <i onClick={() => ctrl.openPlatformStream()} className="icon-studio" />
                  </Tooltip>
                )}
                {isPlatform(['youtube', 'facebook']) && isStreaming && (
                  <Tooltip title={$t('Go to Live Dashboard')} placement="right">
                    <i onClick={() => ctrl.openPlatformDash()} className="icon-settings" />
                  </Tooltip>
                )}
              </div>
              <div className="flex">
                {(isPlatform(['twitch', 'trovo', 'facebook']) ||
                  (isPlatform(['youtube', 'twitter']) && isStreaming)) && (
                  <a onClick={() => ctrl.refreshChat()}>{$t('Refresh Chat')}</a>
                )}
              </div>
            </div>
            {!ctrl.hideStyleBlockers &&
              (isPlatform(['twitch', 'trovo']) ||
                (isStreaming && isPlatform(['youtube', 'facebook', 'twitter']))) && (
                <div className={styles.liveDockChat}>
                  {ctrl.hasChatTabs && (
                    <div className="flex">
                      <Menu
                        selectedKeys={[ctrl.selectedChat]}
                        onClick={ev => ctrl.setChat(ev.key)}
                        mode="horizontal"
                      >
                        {ctrl.chatTabs.map(tab => (
                          <Menu.Item key={tab.value}>{tab.name}</Menu.Item>
                        ))}
                      </Menu>
                      {ctrl.isPopOutAllowed && (
                        <Tooltip title={$t('Pop out to new window')} placement="left">
                          <i
                            className={cx(styles.liveDockChatAppsPopout, 'icon-pop-out-1')}
                            onClick={() => ctrl.popOut()}
                          />
                        </Tooltip>
                      )}
                    </div>
                  )}
                  {!ctrl.applicationLoading && !collapsed && (
                    <Chat restream={ctrl.selectedChat === 'restream'} />
                  )}
                  {!['default', 'restream'].includes(ctrl.selectedChat) && (
                    <PlatformAppPageView
                      className={styles.liveDockPlatformAppWebview}
                      appId={ctrl.selectedChat}
                      pageSlot={ctrl.store.slot}
                      key={ctrl.selectedChat}
                    />
                  )}
                </div>
              )}
            {(!ctrl.platform ||
              (isPlatform(['youtube', 'facebook', 'twitter']) && !isStreaming)) && (
              <div
                className={cx('flex flex--center flex--column', styles.liveDockChatOffline)}
                v-else
              >
                <img className={styles.liveDockChatImgOffline} src={ctrl.offlineImageSrc} />
                {!ctrl.hideStyleBlockers && <span>{$t('Your chat is currently offline')}</span>}
              </div>
            )}
          </div>
        )}
      </Animation>
    </div>
  );
}
