import Vue from 'vue';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { handleResponse, authorizedHeaders, jfetch } from 'util/requests';
import { mutation } from 'services/core/stateful-service';
import { Service, Inject, ViewHandler } from 'services/core';
import electron from 'electron';
import { HostsService } from 'services/hosts';
import {
  getPlatformService,
  IUserAuth,
  TPlatform,
  IPlatformService,
  EPlatformCallResult,
  IPlatformAuth,
} from 'services/platforms';
import { CustomizationService } from 'services/customization';
import * as Sentry from '@sentry/browser';
import { RunInLoadingMode } from 'services/app/app-decorators';
import { SceneCollectionsService } from 'services/scene-collections';
import { Subject, Subscription } from 'rxjs';
import Utils from 'services/utils';
import { WindowsService } from 'services/windows';
import { $t, I18nService } from 'services/i18n';
import uuid from 'uuid/v4';
import { OnboardingService } from 'services/onboarding';
import { NavigationService } from 'services/navigation';
import { SettingsService } from 'services/settings';
import * as obs from '../../../obs-api';
import { StreamSettingsService } from 'services/settings/streaming';
import { lazyModule } from 'util/lazy-module';
import { AuthModule } from './auth-module';
import { WebsocketService, TSocketEvent } from 'services/websocket';
import { MagicLinkService } from 'services/magic-link';
import fs from 'fs';
import path from 'path';
import { AppService } from 'services/app';
import { UsageStatisticsService } from 'services/usage-statistics';
import { StreamingService } from 'services/streaming';
import { NotificationsService, ENotificationType } from 'services/notifications';
import { JsonrpcService } from 'services/api/jsonrpc';

export enum EAuthProcessState {
  Idle = 'idle',
  Loading = 'loading',
  InProgress = 'progress',
}

// Eventually we will support authing multiple platforms at once
interface IUserServiceState {
  loginValidated: boolean;
  auth?: IUserAuth;
  authProcessState: EAuthProcessState;
  isPrime: boolean;
  expires?: string;
  userId?: number;
  createdAt?: number;
  isRelog?: boolean;
}

interface ILinkedPlatform {
  access_token: string;
  platform_id: string;
  platform_name: string;
}

interface ILinkedPlatformsResponse {
  twitch_account?: ILinkedPlatform;
  facebook_account?: ILinkedPlatform;
  youtube_account?: ILinkedPlatform;
  tiktok_account?: ILinkedPlatform;
  user_id: number;
  created_at: string;
}

export type LoginLifecycleOptions = {
  init: () => Promise<void>;
  destroy: () => Promise<void>;
  context: Service;
};

export type LoginLifecycle = {
  destroy: () => Promise<void>;
};

interface ISentryContext {
  username: string;
  platform: string;
}

export function setSentryContext(ctx: ISentryContext) {
  Sentry.configureScope(scope => {
    scope.setUser({ username: ctx.username });
    scope.setExtra('platform', ctx.platform);
  });

  if (Utils.isWorkerWindow()) {
    obs.NodeObs.SetUsername(ctx.username);

    // Sets main process sentry context. Only need to do this once.
    electron.remote.crashReporter.addExtraParameter('sentry[user][username]', ctx.username);
    electron.remote.crashReporter.addExtraParameter('platform', ctx.platform);
  }
  electron.crashReporter.addExtraParameter('sentry[user][username]', ctx.username);
  electron.crashReporter.addExtraParameter('platform', ctx.platform);
}

class UserViews extends ViewHandler<IUserServiceState> {
  get isLoggedIn() {
    return !!(this.state.auth && this.state.auth.widgetToken && this.state.loginValidated);
  }

  get isPrime() {
    return this.state.isPrime;
  }

  get platform() {
    if (this.isLoggedIn) {
      return this.state.auth.platforms[this.state.auth.primaryPlatform];
    }
  }

  get platforms() {
    if (this.isLoggedIn) {
      return this.state.auth.platforms;
    }
  }

  get isTwitchAuthed() {
    return this.isLoggedIn && this.platform.type === 'twitch';
  }

  get isFacebookAuthed() {
    return this.isLoggedIn && this.platform.type === 'facebook';
  }

  get auth() {
    return this.state.auth;
  }
}

export class UserService extends PersistentStatefulService<IUserServiceState> {
  @Inject() private hostsService: HostsService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private windowsService: WindowsService;
  @Inject() private onboardingService: OnboardingService;
  @Inject() private navigationService: NavigationService;
  @Inject() private settingsService: SettingsService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private websocketService: WebsocketService;
  @Inject() private magicLinkService: MagicLinkService;
  @Inject() private appService: AppService;
  @Inject() private usageStatisticsService: UsageStatisticsService;
  @Inject() private notificationsService: NotificationsService;
  @Inject() private jsonrpcService: JsonrpcService;

  @mutation()
  LOGIN(auth: IUserAuth) {
    Vue.set(this.state, 'auth', auth);

    // For now, to ensure safe rollbacks, we will set the old format
    Vue.set(this.state.auth, 'platform', auth.platforms[auth.primaryPlatform]);
  }

  @mutation()
  UPDATE_PLATFORM(auth: IPlatformAuth) {
    Vue.set(this.state.auth.platforms, auth.type, auth);
  }

  @mutation()
  UNLINK_PLATFORM(platform: TPlatform) {
    Vue.delete(this.state.auth.platforms, platform);
  }

  @mutation()
  LOGOUT() {
    Vue.delete(this.state, 'auth');
    this.state.isPrime = false;
    Vue.delete(this.state, 'userId');
  }

  @mutation()
  SET_PRIME(isPrime: boolean) {
    this.state.isPrime = isPrime;
  }

  @mutation()
  SET_EXPIRES(expires: string) {
    this.state.expires = expires;
  }

  @mutation()
  SET_USER(userId: number, createdAt: string) {
    this.state.userId = userId;
    this.state.createdAt = new Date(createdAt).valueOf();
  }

  @mutation()
  private SET_PLATFORM_TOKEN(platform: TPlatform, token: string) {
    this.state.auth.platforms[platform].token = token;
  }

  @mutation()
  private SET_CHANNEL_ID(platform: TPlatform, id: string) {
    this.state.auth.platforms[platform].channelId = id;
  }

  @mutation()
  private SET_USERNAME(platform: TPlatform, name: string) {
    this.state.auth.platforms[platform].channelId = name;
  }

  @mutation()
  private VALIDATE_LOGIN(validated: boolean) {
    Vue.set(this.state, 'loginValidated', validated);
  }

  @mutation()
  private SET_AUTH_STATE(state: EAuthProcessState) {
    Vue.set(this.state, 'authProcessState', state);
  }

  @mutation()
  private SET_IS_RELOG(isrelog: boolean) {
    Vue.set(this.state, 'isRelog', isrelog);
  }

  /**
   * Checks for v1 auth schema and migrates if needed
   */
  @mutation()
  private MIGRATE_AUTH() {
    if (!this.state.auth) return;

    if (this.state.auth.platform && !this.state.auth.platforms) {
      Vue.set(this.state.auth, 'platforms', {
        [this.state.auth.platform.type]: this.state.auth.platform,
      });
      Vue.set(this.state.auth, 'primaryPlatform', this.state.auth.platform.type);

      // We are not deleting the old key for now to ensure compatibility
      // in the case we have to roll back. Eventually we should remove it.
    }
  }

  userLogin = new Subject<IUserAuth>();
  userLogout = new Subject();

  /**
   * Will fire on every login, similar to userLogin, but will
   * fire after all normal on-login operations have finished.
   * Useful when you need to check the state of a user after
   * everything has finished updating.
   */
  userLoginFinished = new Subject();
  private socketConnection: Subscription = null;

  /**
   * Used by child and 1-off windows to update their sentry contexts
   */
  sentryContext = new Subject<ISentryContext>();

  @lazyModule(AuthModule) private authModule: AuthModule;

  async init() {
    super.init();
    this.MIGRATE_AUTH();
    this.VALIDATE_LOGIN(false);
    this.SET_AUTH_STATE(EAuthProcessState.Idle);
  }

  get views() {
    return new UserViews(this.state);
  }

  mounted() {
    // This is used for faking authentication in tests.  We have
    // to do this because Twitch adds a captcha when we try to
    // actually log in from integration tests.
    electron.ipcRenderer.on(
      'testing-fakeAuth',
      async (e: Electron.Event, auth: IUserAuth, isOnboardingTest: boolean) => {
        const service = getPlatformService(auth.primaryPlatform);
        this.streamSettingsService.resetStreamSettings();
        await this.login(service, auth);
        if (!isOnboardingTest) this.onboardingService.finish();
      },
    );
  }

  async autoLogin() {
    if (!this.state.auth) return;

    if (!this.state.auth.hasRelogged) {
      await electron.remote.session.defaultSession.clearCache();
      await electron.remote.session.defaultSession.clearStorageData({
        storages: ['appcache, cookies', 'cachestorage', 'filesystem'],
      });
      this.streamSettingsService.resetStreamSettings();
      this.LOGOUT();
      this.SET_IS_RELOG(true);
      this.showLogin();
    } else {
      // don't allow to login via deleted Mixer platform
      const allPlatforms = this.streamingService.views.allPlatforms;
      if (!allPlatforms.includes(this.state.auth.primaryPlatform)) return;

      const service = getPlatformService(this.state.auth.primaryPlatform);
      return this.login(service, this.state.auth);
    }
  }

  subscribeToSocketConnection() {
    this.socketConnection = this.websocketService.socketEvent.subscribe(ev =>
      this.onSocketEvent(ev),
    );
    return Promise.resolve();
  }

  unsubscribeFromSocketConnection() {
    if (this.socketConnection) this.socketConnection.unsubscribe();
    return Promise.resolve();
  }

  // Makes sure the user's login is still good
  async validateLogin(): Promise<boolean> {
    if (!this.state.auth) return;

    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.apiToken);
    const url = `https://${host}/api/v5/slobs/validate`;
    const request = new Request(url, { headers });

    const valid = await fetch(request).then(res => {
      return res.text();
    });

    if (valid.match(/false/)) {
      return false;
    }

    return true;
  }

  /**
   * Attempt to update user info via API.  This is mainly
   * to support name changes on Twitch.
   */
  async refreshUserInfo() {
    if (!this.isLoggedIn) return;

    // Make a best attempt to refresh the user data
    try {
      const service = getPlatformService(this.platform.type);
      const userInfo = await service.fetchUserInfo();

      if (userInfo.username) {
        this.SET_USERNAME(this.platform.type, userInfo.username);
      }
    } catch (e: unknown) {
      console.error('Error fetching user info', e);
    }
  }

  /**
   * Makes a best attempt to write a user id to disk. Does not
   * guarantee it will succeed. Calling this function will never
   * fail. This is used by the updater.
   * @param userId The user id to write
   */
  writeUserIdFile(userId?: number) {
    const filePath = path.join(this.appService.appDataDirectory, 'userId');
    fs.writeFile(filePath, userId?.toString() ?? '', err => {
      if (err) {
        console.error('Error writing user id file', err);
      }
    });
  }

  async updateLinkedPlatforms() {
    const linkedPlatforms = await this.fetchLinkedPlatforms();

    if (!linkedPlatforms) return;

    if (linkedPlatforms.user_id) {
      this.writeUserIdFile(linkedPlatforms.user_id);
      this.SET_USER(linkedPlatforms.user_id, linkedPlatforms.created_at);
    }

    // TODO: Could metaprogram this a bit more
    if (linkedPlatforms.facebook_account) {
      this.UPDATE_PLATFORM({
        type: 'facebook',
        username: linkedPlatforms.facebook_account.platform_name,
        id: linkedPlatforms.facebook_account.platform_id,
        token: linkedPlatforms.facebook_account.access_token,
      });
    } else if (this.state.auth.primaryPlatform !== 'facebook') {
      this.UNLINK_PLATFORM('facebook');
    }

    if (linkedPlatforms.twitch_account) {
      this.UPDATE_PLATFORM({
        type: 'twitch',
        username: linkedPlatforms.twitch_account.platform_name,
        id: linkedPlatforms.twitch_account.platform_id,
        token: linkedPlatforms.twitch_account.access_token,
      });
    } else if (this.state.auth.primaryPlatform !== 'twitch') {
      this.UNLINK_PLATFORM('twitch');
    }

    if (linkedPlatforms.youtube_account) {
      this.UPDATE_PLATFORM({
        type: 'youtube',
        username: linkedPlatforms.youtube_account.platform_name,
        id: linkedPlatforms.youtube_account.platform_id,
        token: linkedPlatforms.youtube_account.access_token,
      });
    } else if (this.state.auth.primaryPlatform !== 'youtube') {
      this.UNLINK_PLATFORM('youtube');
    }

    if (linkedPlatforms.tiktok_account) {
      this.UPDATE_PLATFORM({
        type: 'tiktok',
        username: linkedPlatforms.tiktok_account.platform_name,
        id: linkedPlatforms.tiktok_account.platform_id,
        token: linkedPlatforms.tiktok_account.access_token,
      });
    } else if (this.state.auth.primaryPlatform !== 'tiktok') {
      this.UNLINK_PLATFORM('tiktok');
    }
  }

  fetchLinkedPlatforms() {
    if (!this.isLoggedIn) return;

    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.apiToken);
    const url = `https://${host}/api/v5/restream/user/info`;
    const request = new Request(url, { headers });

    return jfetch<ILinkedPlatformsResponse>(request).catch(() => {
      console.warn('Error fetching linked platforms');
    });
  }

  get isPrime() {
    return this.state.isPrime;
  }

  async setPrimeStatus() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/prime`;
    const headers = authorizedHeaders(this.apiToken);
    const request = new Request(url, { headers });
    return jfetch<{
      expires_soon: boolean;
      expires_at: string;
      is_prime: boolean;
      cc_expires_in_days?: number;
    }>(request)
      .then(response => this.validatePrimeStatus(response))
      .catch(() => null);
  }

  validatePrimeStatus(response: {
    expires_soon: boolean;
    expires_at: string;
    is_prime: boolean;
    cc_expires_in_days?: number;
  }) {
    this.SET_PRIME(response.is_prime);
    if (response.cc_expires_in_days != null) this.sendExpiresSoonNotification();
    if (!response.expires_soon) {
      this.SET_EXPIRES(null);
      return;
    } else if (!this.state.expires) {
      this.SET_EXPIRES(response.expires_at);
      this.usageStatisticsService.recordShown('prime-resubscribe-modal');
      this.onboardingService.start({ isPrimeExpiration: true });
    }
  }

  sendExpiresSoonNotification() {
    this.notificationsService.push({
      type: ENotificationType.WARNING,
      lifeTime: -1,
      action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'openCreditCardLink'),
      message: $t('Your credit card expires soon. Click here to retain your Prime benefits'),
    });
  }

  async openCreditCardLink() {
    try {
      const link = await this.magicLinkService.getDashboardMagicLink('expiring_cc');
      electron.shell.openExternal(link);
    } catch (e: unknown) {}
  }

  /**
   * Attempts to flush the user's session to disk if it exists
   */
  flushUserSession(): Promise<void> {
    if (this.isLoggedIn && this.state.auth.partition) {
      const session = electron.remote.session.fromPartition(this.state.auth.partition);
      session.flushStorageData();
      return session.cookies.flushStore();
    }

    return Promise.resolve();
  }

  get isLoggedIn() {
    return !!(this.state.auth && this.state.auth.widgetToken && this.state.loginValidated);
  }

  /**
   * This is a uuid that persists across the application lifetime and uniquely
   * identifies this particular installation of slobs, even when the user is
   * not logged in.
   */
  getLocalUserId() {
    const localStorageKey = 'SlobsLocalUserId';
    let userId = localStorage.getItem(localStorageKey);

    if (!userId) {
      userId = uuid();
      localStorage.setItem(localStorageKey, userId);
    }

    return userId;
  }

  get apiToken() {
    if (this.state.auth) return this.state.auth.apiToken;
  }

  get widgetToken() {
    if (this.isLoggedIn) {
      return this.state.auth.widgetToken;
    }
  }

  /**
   * Returns the auth for the primary platform
   */
  get platform() {
    if (this.isLoggedIn) {
      return this.state.auth.platforms[this.state.auth.primaryPlatform];
    }
  }

  get platformType(): TPlatform {
    if (this.isLoggedIn) {
      return this.state.auth.primaryPlatform;
    }
  }

  get username() {
    if (this.isLoggedIn) {
      return this.platform.username;
    }
  }

  get platformId() {
    if (this.isLoggedIn) {
      return this.platform.id;
    }
  }

  get channelId() {
    if (this.isLoggedIn) {
      return this.platform.channelId;
    }
  }

  showPrimeWindow() {
    this.windowsService.showWindow({
      componentName: 'WelcomeToPrime',
      title: '',
      size: { width: 1000, height: 720 },
    });
  }

  onSocketEvent(e: TSocketEvent) {
    if (e.type !== 'streamlabs_prime_subscribe') return;
    this.SET_PRIME(true);
    if (this.navigationService.state.currentPage === 'Onboarding') return;
    const theme = this.customizationService.isDarkTheme ? 'prime-dark' : 'prime-light';
    this.customizationService.setTheme(theme);
    this.showPrimeWindow();
  }

  recentEventsUrl() {
    if (this.isLoggedIn) {
      const host = this.hostsService.streamlabs;
      const token = this.widgetToken;
      const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
      const isMediaShare =
        this.windowsService.state.RecentEvents &&
        this.windowsService.state.RecentEvents.queryParams.isMediaShare
          ? '&view=media-share'
          : '';

      return `https://${host}/dashboard/recent-events?token=${token}&mode=${nightMode}&electron${isMediaShare}`;
    }
  }

  dashboardUrl(subPage: string, hidenav: boolean = false) {
    const token = this.apiToken;
    const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const hideNav = hidenav ? 'true' : 'false';
    const i18nService = I18nService.instance as I18nService; // TODO: replace with getResource('I18nService')
    const locale = i18nService.state.locale;
    // eslint-disable-next-line
    return `https://${
      this.hostsService.streamlabs
    }/slobs/dashboard?oauth_token=${token}&mode=${nightMode}&r=${subPage}&l=${locale}&hidenav=${hideNav}`;
  }

  appStoreUrl(appId?: string) {
    const host = this.hostsService.platform;
    const token = this.apiToken;
    const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
    let url = `https://${host}/slobs-store`;

    if (appId) {
      url = `${url}/app/${appId}`;
    }

    return `${url}?token=${token}&mode=${nightMode}`;
  }

  overlaysUrl(type?: 'overlay' | 'widget-theme', id?: string) {
    const uiTheme = this.customizationService.isDarkTheme ? 'night' : 'day';
    let url = `https://${this.hostsService.streamlabs}/library?mode=${uiTheme}&slobs`;

    if (this.isLoggedIn) {
      url += `&oauth_token=${this.apiToken}`;
    }

    if (type && id) {
      url += `#/?type=${type}&id=${id}`;
    }

    return url;
  }

  alertboxLibraryUrl(id?: string) {
    const uiTheme = this.customizationService.isDarkTheme ? 'night' : 'day';
    let url = `https://${this.hostsService.streamlabs}/alertbox-library?mode=${uiTheme}&slobs`;

    if (this.isLoggedIn) {
      url += `&oauth_token=${this.apiToken}`;
    }

    if (id) url += `&id=${id}`;

    return url;
  }

  getDonationSettings() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/donation/settings`;
    const headers = authorizedHeaders(this.apiToken);
    const request = new Request(url, { headers });

    return jfetch<{ donation_url: string; settings: { autopublish: boolean } }>(request);
  }

  async showLogin() {
    if (this.isLoggedIn) await this.logOut();
    this.onboardingService.start({ isLogin: true });
  }

  @RunInLoadingMode()
  private async login(service: IPlatformService, auth?: IUserAuth) {
    if (!auth) auth = this.state.auth;
    this.LOGIN(auth);
    this.VALIDATE_LOGIN(true);
    this.setSentryContext();
    this.userLogin.next(auth);

    const [validateLoginResult, validatePlatformResult] = await Promise.all([
      this.validateLogin(),
      service.validatePlatform(),
      this.updateLinkedPlatforms(),
      this.refreshUserInfo(),
      this.sceneCollectionsService.setupNewUser(),
      this.setPrimeStatus(),
    ]);
    this.subscribeToSocketConnection();

    if (!validateLoginResult) {
      this.logOut();
      electron.remote.dialog.showMessageBox({
        title: 'Streamlabs Desktop',
        message: $t('You have been logged out'),
      });
      return;
    }

    // Currently we treat generic errors as success
    if (validatePlatformResult === EPlatformCallResult.TwitchTwoFactor) {
      this.logOut();
      return validatePlatformResult;
    }

    if (validatePlatformResult === EPlatformCallResult.TwitchScopeMissing) {
      await this.logOut();
      this.showLogin();

      electron.remote.dialog.showMessageBox(electron.remote.getCurrentWindow(), {
        type: 'warning',
        title: 'Twitch Error',
        message: $t(
          $t('Your Twitch login is expired. Please log in again to continue using Streamlabs'),
        ),
        buttons: [$t('Refresh Login')],
      });

      return validatePlatformResult;
    }

    this.userLoginFinished.next();
  }

  @RunInLoadingMode()
  async logOut() {
    // Attempt to sync scense before logging out
    await this.sceneCollectionsService.save();
    await this.sceneCollectionsService.safeSync();
    // Navigate away from disabled tabs on logout
    this.navigationService.navigate('Studio');

    const session = this.state.auth.partition
      ? electron.remote.session.fromPartition(this.state.auth.partition)
      : electron.remote.session.defaultSession;

    session.clearStorageData({ storages: ['cookies'] });
    this.settingsService.setSettingValue('Stream', 'key', '');

    this.writeUserIdFile();
    this.unsubscribeFromSocketConnection();
    this.LOGOUT();
    this.userLogout.next();
  }

  async reLogin() {
    const platform = this.state.auth.primaryPlatform;
    await this.logOut();
    await this.startAuth(platform, 'internal');
  }

  /**
   * Starts the authentication process.  Multiple callbacks
   * can be passed for various events.
   */
  async startAuth(
    platform: TPlatform,
    mode: 'internal' | 'external',
    merge = false,
  ): Promise<EPlatformCallResult> {
    const service = getPlatformService(platform);
    const authUrl = merge ? service.mergeUrl : service.authUrl;

    if (merge && !this.isLoggedIn) {
      throw new Error('Account merging can only be performed while logged in');
    }

    this.SET_AUTH_STATE(EAuthProcessState.Loading);
    const onWindowShow = () =>
      this.SET_AUTH_STATE(
        mode === 'internal' ? EAuthProcessState.InProgress : EAuthProcessState.Idle,
      );
    const onWindowClose = () => this.SET_AUTH_STATE(EAuthProcessState.Idle);

    const auth =
      mode === 'internal'
        /* eslint-disable */
        ? await this.authModule.startInternalAuth(
          authUrl,
          service.authWindowOptions,
          onWindowShow,
          onWindowClose,
          merge,
        )
        : await this.authModule.startExternalAuth(authUrl, onWindowShow, merge);
        /* eslint-enable */

    this.SET_AUTH_STATE(EAuthProcessState.Loading);
    this.SET_IS_RELOG(false);

    let result: EPlatformCallResult;

    if (!merge) {
      // Ensure we are starting with fresh stream settings
      this.streamSettingsService.resetStreamSettings();

      result = await this.login(service, auth);
    } else {
      this.UPDATE_PLATFORM(auth.platforms[auth.primaryPlatform]);
      result = EPlatformCallResult.Success;
    }

    this.SET_AUTH_STATE(EAuthProcessState.Idle);
    return result;
  }

  updatePlatformToken(platform: TPlatform, token: string) {
    this.SET_PLATFORM_TOKEN(platform, token);
  }

  updatePlatformChannelId(platform: TPlatform, id: string) {
    this.SET_CHANNEL_ID(platform, id);
  }

  /**
   * Registers the current user information with Sentry so
   * we can view more detailed information.
   */
  setSentryContext() {
    if (!this.isLoggedIn) return;

    setSentryContext(this.getSentryContext());

    this.sentryContext.next(this.getSentryContext());
  }

  getSentryContext(): ISentryContext {
    if (!this.isLoggedIn) return null;

    return {
      username: this.username,
      platform: this.platform.type,
    };
  }

  /**
   * Abstracts a common pattern of performing an action if the user is logged in, listening for user
   * login events to perform that action at the point the user logs in, and doing cleanup on logout.
   *
   * @param init A function to be performed immediately if the user is logged in, and on every login
   * @param destroy A function to be performed when the user logs out
   * @param context `this` binding
   * @returns An object with a `destroy` method that will perform cleanup (including un-subscribing
   * from login events), typically invoked on a Service's `destroyed` method.
   * @example
   * class ChatService extends Service {
   *   @Inject() userService: UserService;
   *
   *   init() {
   *     this.lifecycle = this.userService.withLifecycle({
   *       init: this.initChat,
   *       destroy: this.deinitChat,
   *       context: this,
   *     })
   *   }
   *
   *   async initChat() { ... }
   *   async deinitChat() { ... }
   *
   *   async destroyed() {
   *     this.lifecycle.destroy();
   *   }
   * }
   */
  async withLifecycle({ init, destroy, context }: LoginLifecycleOptions): Promise<LoginLifecycle> {
    const doInit = init.bind(context);
    const doDestroy = destroy.bind(context);

    const userLoginSubscription = this.userLogin.subscribe(() => doInit());
    const userLogoutSubscription = this.userLogout.subscribe(() => doDestroy());

    if (this.isLoggedIn) {
      await doInit();
    }

    return {
      destroy: async () => {
        userLoginSubscription.unsubscribe();
        userLogoutSubscription.unsubscribe();
        await doDestroy();
      },
    } as LoginLifecycle;
  }
}
