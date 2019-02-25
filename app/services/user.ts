import Vue from 'vue';
import URI from 'urijs';
import { defer } from 'lodash';
import { PersistentStatefulService } from 'services/persistent-stateful-service';
import { Inject } from 'util/injector';
import { handleResponse, authorizedHeaders } from 'util/requests';
import { mutation } from 'services/stateful-service';
import electron from 'electron';
import { HostsService } from './hosts';
import { ChatbotApiService } from './chatbot';
import { IncrementalRolloutService } from 'services/incremental-rollout';
import { PlatformAppsService } from 'services/platform-apps';
import { getPlatformService, IPlatformAuth, TPlatform, IPlatformService } from './platforms';
import { CustomizationService } from 'services/customization';
import * as Sentry from '@sentry/browser';
import { RunInLoadingMode } from 'services/app/app-decorators';
import { SceneCollectionsService } from 'services/scene-collections';
import { Subject } from 'rxjs';
import Util from 'services/utils';
import { WindowsService } from 'services/windows';
import { $t } from 'services/i18n';
import uuid from 'uuid/v4';
import { OnboardingService } from './onboarding';
import { NavigationService } from './navigation';

// Eventually we will support authing multiple platforms at once
interface IUserServiceState {
  auth?: IPlatformAuth;
}

export class UserService extends PersistentStatefulService<IUserServiceState> {
  @Inject() private hostsService: HostsService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private sceneCollectionsService: SceneCollectionsService;
  @Inject() private windowsService: WindowsService;
  @Inject() private onboardingService: OnboardingService;
  @Inject() private navigationService: NavigationService;
  @Inject() private chatbotApiService: ChatbotApiService;
  @Inject() private incrementalRolloutService: IncrementalRolloutService;
  @Inject() private platformAppsService: PlatformAppsService;

  @mutation()
  LOGIN(auth: IPlatformAuth) {
    Vue.set(this.state, 'auth', auth);
  }

  @mutation()
  LOGOUT() {
    Vue.delete(this.state, 'auth');
  }

  @mutation()
  private SET_PLATFORM_TOKEN(token: string) {
    this.state.auth.platform.token = token;
  }

  @mutation()
  private SET_CHANNEL_ID(id: string) {
    this.state.auth.platform.channelId = id;
  }

  @mutation()
  private SET_USERNAME(name: string) {
    this.state.auth.platform.channelId = name;
  }

  userLogin = new Subject<IPlatformAuth>();
  userLogout = new Subject();

  init() {
    super.init();
    this.setSentryContext();
    this.validateLogin();
    this.incrementalRolloutService.fetchAvailableFeatures();
  }

  async initialize() {
    await this.refreshUserInfo();
  }

  mounted() {
    // This is used for faking authentication in tests.  We have
    // to do this because Twitch adds a captcha when we try to
    // actually log in from integration tests.
    electron.ipcRenderer.on('testing-fakeAuth', async (e: Electron.Event, auth: IPlatformAuth) => {
      const service = getPlatformService(auth.platform.type);
      await this.login(service, auth);
      this.onboardingService.next();
    });
  }

  // Makes sure the user's login is still good
  validateLogin() {
    if (!this.isLoggedIn()) return;

    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.apiToken);
    const url = `https://${host}/api/v5/slobs/validate`;
    const request = new Request(url, { headers });

    fetch(request)
      .then(res => {
        return res.text();
      })
      .then(valid => {
        if (valid.match(/false/)) this.LOGOUT();
      });
  }

  /**
   * Attempt to update user info via API.  This is mainly
   * to support name changes on Twitch.
   */
  async refreshUserInfo() {
    if (!this.isLoggedIn()) return;

    // Make a best attempt to refresh the user data
    try {
      const service = getPlatformService(this.platform.type);
      const userInfo = await service.fetchUserInfo();

      if (userInfo.username) {
        this.SET_USERNAME(userInfo.username);
      }
    } catch (e) {
      console.error('Error fetching user info', e);
    }
  }

  isLoggedIn() {
    return !!(this.state.auth && this.state.auth.widgetToken);
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
    if (this.isLoggedIn()) return this.state.auth.apiToken;
  }

  get widgetToken() {
    if (this.isLoggedIn()) {
      return this.state.auth.widgetToken;
    }
  }

  get platform() {
    if (this.isLoggedIn()) {
      return this.state.auth.platform;
    }
  }

  get username() {
    if (this.isLoggedIn()) {
      return this.state.auth.platform.username;
    }
  }

  get platformId() {
    if (this.isLoggedIn()) {
      return this.state.auth.platform.id;
    }
  }

  get channelId() {
    if (this.isLoggedIn()) {
      return this.state.auth.platform.channelId;
    }
  }

  recentEventsUrl() {
    if (this.isLoggedIn()) {
      const host = this.hostsService.streamlabs;
      const token = this.widgetToken;
      const nightMode = this.customizationService.nightMode ? 'night' : 'day';

      return `https://${host}/dashboard/recent-events?token=${token}&mode=${nightMode}&electron`;
    }
  }

  dashboardUrl(subPage: string) {
    const host = Util.isPreview() ? this.hostsService.beta3 : this.hostsService.streamlabs;
    const token = this.apiToken;
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';

    return `https://${host}/slobs/dashboard?oauth_token=${token}&mode=${nightMode}&r=${subPage}`;
  }

  appStoreUrl(appId?: string) {
    const host = this.hostsService.platform;
    const token = this.apiToken;
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';
    let url = `https://${host}/slobs-store`;

    if (appId) {
      url = `${url}/app/${appId}`;
    }

    return `${url}?token=${token}&mode=${nightMode}`;
  }

  overlaysUrl(type?: 'overlay' | 'widget-theme', id?: string) {
    const host = Util.isPreview() ? this.hostsService.beta3 : this.hostsService.streamlabs;
    const uiTheme = this.customizationService.nightMode ? 'night' : 'day';
    let url = `https://${host}/library?mode=${uiTheme}&slobs`;

    if (this.isLoggedIn()) {
      url += `&oauth_token=${this.apiToken}`;
    }

    if (type && id) {
      url += `#/?type=${type}&id=${id}`;
    }

    return url;
  }

  getDonationSettings() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/donation/settings`;
    const headers = authorizedHeaders(this.apiToken);
    const request = new Request(url, { headers });

    return fetch(request).then(handleResponse);
  }

  async showLogin() {
    if (this.isLoggedIn()) await this.logOut();
    this.onboardingService.start({ isLogin: true });
  }

  @RunInLoadingMode()
  private async login(service: IPlatformService, auth: IPlatformAuth) {
    this.LOGIN(auth);
    this.setSentryContext();
    service.setupStreamSettings(auth);
    this.userLogin.next(auth);
    await this.sceneCollectionsService.setupNewUser();
  }

  @RunInLoadingMode()
  async logOut() {
    // Attempt to sync scense before logging out
    await this.sceneCollectionsService.save();
    await this.sceneCollectionsService.safeSync();
    // signs out of chatbot
    await this.chatbotApiService.logOut();
    // Navigate away from disabled tabs on logout
    this.navigationService.navigate('Studio');
    this.LOGOUT();
    this.userLogout.next();
    electron.remote.session.defaultSession.clearStorageData({ storages: ['cookies'] });
    this.platformAppsService.unloadAllApps();
  }

  getFacebookPages() {
    if (this.platform.type !== 'facebook') return;
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
    const headers = authorizedHeaders(this.apiToken);
    const request = new Request(url, { headers });
    return fetch(request)
      .then(handleResponse)
      .catch(() => null);
  }

  postFacebookPage(pageId: string) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/user/facebook/pages`;
    const headers = authorizedHeaders(this.apiToken);
    headers.append('Content-Type', 'application/json');
    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({ page_id: pageId, page_type: 'page' }),
    });
    try {
      fetch(request).then(() => this.updatePlatformChannelId(pageId));
    } catch {
      console.error(new Error('Could not set Facebook page'));
    }
  }

  /**
   * Starts the authentication process.  Multiple callbacks
   * can be passed for various events.
   */
  startAuth(
    platform: TPlatform,
    onWindowShow: (...args: any[]) => any,
    onAuthStart: (...args: any[]) => any,
    onAuthFinish: (...args: any[]) => any,
  ) {
    const service = getPlatformService(platform);

    const authWindow = new electron.remote.BrowserWindow({
      ...service.authWindowOptions,
      alwaysOnTop: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        nativeWindowOpen: true,
        sandbox: true,
      },
    });

    authWindow.webContents.on('did-navigate', async (e, url) => {
      const parsed = this.parseAuthFromUrl(url);

      if (parsed) {
        authWindow.close();
        onAuthStart();
        await this.login(service, parsed);
        defer(onAuthFinish);
      }
    });

    authWindow.once('ready-to-show', () => {
      authWindow.show();
      defer(onWindowShow);
    });

    authWindow.setMenu(null);
    authWindow.loadURL(service.authUrl);
  }

  updatePlatformToken(token: string) {
    this.SET_PLATFORM_TOKEN(token);
  }

  updatePlatformChannelId(id: string) {
    this.SET_CHANNEL_ID(id);
  }

  /**
   * Parses tokens out of the auth URL
   */
  private parseAuthFromUrl(url: string) {
    const query = URI.parseQuery(URI.parse(url).query) as Dictionary<string>;

    if (
      query.token &&
      query.platform_username &&
      query.platform_token &&
      query.platform_id &&
      query.oauth_token
    ) {
      return {
        widgetToken: query.token,
        apiToken: query.oauth_token,
        platform: {
          type: query.platform,
          username: query.platform_username,
          token: query.platform_token,
          id: query.platform_id,
        },
      } as IPlatformAuth;
    }

    return false;
  }

  /**
   * Registers the current user information with Sentry so
   * we can view more detailed information.
   */
  setSentryContext() {
    if (!this.isLoggedIn()) return;

    Sentry.configureScope(scope => {
      scope.setUser({ username: this.username });
      scope.setExtra('platform', this.platform.type);
    });
  }

  popoutRecentEvents() {
    this.windowsService.createOneOffWindow(
      {
        componentName: 'RecentEvents',
        title: $t('Recent Events'),
        size: {
          width: 800,
          height: 600,
        },
      },
      'RecentEvents',
    );
  }
}

/**
 * You can use this decorator to ensure the user is logged in
 * before proceeding
 */
export function requiresLogin() {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    return {
      ...descriptor,
      value(...args: any[]) {
        // TODO: Redirect to login if not logged in?
        if (UserService.instance.isLoggedIn()) return original.apply(target, args);
      },
    };
  };
}
