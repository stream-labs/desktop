import Vue from 'vue';
import URI from 'urijs';
import { defer } from 'lodash';
import { PersistentStatefulService } from './persistent-stateful-service';
import { Inject } from '../util/injector';
import { handleErrors } from '../util/requests';
import { mutation } from './stateful-service';
import electron from 'electron';
import { HostsService } from './hosts';
import {
  getPlatformService,
  IPlatformAuth,
  TPlatform,
  IPlatformService
} from './platforms';
import { CustomizationService } from './customization';
import Raven from 'raven-js';
import { AppService } from 'services/app';
import { SceneCollectionsService } from 'services/scene-collections';
import { Subject } from 'rxjs/Subject';

// Eventually we will support authing multiple platforms at once
interface IUserServiceState {
  auth?: IPlatformAuth;
}

export class UserService extends PersistentStatefulService<IUserServiceState> {
  @Inject() hostsService: HostsService;
  @Inject() customizationService: CustomizationService;
  @Inject() appService: AppService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

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

  userLogin = new Subject<IPlatformAuth>();

  init() {
    super.init();
    this.setRavenContext();
    this.validateLogin();
  }

  mounted() {
    // This is used for faking authentication in tests.  We have
    // to do this because Twitch adds a captcha when we try to
    // actually log in from integration tests.
    electron.ipcRenderer.on(
      'testing-fakeAuth',
      (e: Electron.Event, auth: any) => {
        this.LOGIN(auth);
      }
    );
  }

  // Makes sure the user's login is still good
  validateLogin() {
    if (!this.isLoggedIn()) return;

    const host = this.hostsService.streamlabs;
    const token = this.widgetToken;
    const url = `https://${host}/api/v5/slobs/validate/${token}`;
    const request = new Request(url);

    fetch(request)
      .then(res => {
        return res.text();
      })
      .then(valid => {
        if (valid.match(/false/)) this.LOGOUT();
      });
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
      userId = electron.ipcRenderer.sendSync('getUniqueId');
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

  widgetUrl(type: string) {
    if (this.isLoggedIn()) {
      const host = this.hostsService.streamlabs;
      const token = this.widgetToken;
      const nightMode = this.customizationService.nightMode ? 'night' : 'day';

      if (type === 'recent-events') {
        return `https://${host}/dashboard/recent-events?token=${token}&mode=${nightMode}&electron`;
      }

      if (type === 'dashboard') {
        return `https://${host}/slobs/dashboard/${token}?mode=${nightMode}&show_recent_events=0`;
      }

      if (type === 'alertbox') {
        return `https://${host}/slobs/dashboard/alertbox/${token}?mode=${nightMode}`;
      }
    }
  }

  dashboardUrl(subPage: string) {
    const host = this.hostsService.streamlabs;
    const token = this.widgetToken;
    const nightMode = this.customizationService.nightMode ? 'night' : 'day';

    return `https://${host}/slobs/dashboard/${token}?mode=${nightMode}&r=${subPage}`;
  }

  overlaysUrl() {
    const host = this.hostsService.beta2;
    const uiTheme = this.customizationService.nightMode ? 'night' : 'day';
    let url = `https://${host}/library?mode=${uiTheme}&slobs`;

    if (this.isLoggedIn()) {
      url = url + `&token=${this.widgetToken}`;
    }

    return url;
  }

  getDonationSettings() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/donation/settings/${this.widgetToken}`;
    const request = new Request(url);

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  private async login(service: IPlatformService, auth: IPlatformAuth) {
    this.LOGIN(auth);
    this.userLogin.next(auth);
    this.setRavenContext();
    service.setupStreamSettings(auth);
    await this.sceneCollectionsService.setupNewUser();
  }

  async logOut() {
    // Attempt to sync scense before logging out
    this.appService.startLoading();
    await this.sceneCollectionsService.save();
    await this.sceneCollectionsService.safeSync();
    this.LOGOUT();
    this.appService.finishLoading();
  }

  /**
   * Starts the authentication process.  Multiple callbacks
   * can be passed for various events.
   */
  startAuth(
    platform: TPlatform,
    onWindowShow: Function,
    onAuthStart: Function,
    onAuthFinish: Function
  ) {
    const service = getPlatformService(platform);

    const authWindow = new electron.remote.BrowserWindow({
      ...service.authWindowOptions,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        nodeIntegration: false
      }
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

  /**
   * Parses tokens out of the auth URL
   */
  private parseAuthFromUrl(url: string) {
    const query = URI.parseQuery(URI.parse(url).query);

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
          id: query.platform_id
        }
      } as IPlatformAuth;
    }

    return false;
  }

  /**
   * Registers the current user information with Raven so
   * we can view more detailed information in sentry.
   */
  setRavenContext() {
    if (!this.isLoggedIn()) return;
    Raven.setUserContext({ username: this.username });
    Raven.setExtraContext({ platform: this.platform.type });
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
        if (UserService.instance.isLoggedIn())
          return original.apply(target, args);
      }
    };
  };
}
