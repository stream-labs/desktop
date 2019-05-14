import Vue from 'vue';
import URI from 'urijs';
import { defer } from 'lodash';
import { PersistentStatefulService } from './persistent-stateful-service';
import { Inject } from '../util/injector';
import { mutation } from './stateful-service';
import electron from 'electron';
import { HostsService } from './hosts';
import {
  getPlatformService,
  IPlatformAuth,
  TPlatform,
  IPlatformService,
  IStreamingSetting
} from './platforms';
import { CustomizationService } from './customization';
import Raven from 'raven-js';
import { AppService } from 'services/app';
import { SceneCollectionsService } from 'services/scene-collections';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { mergeStatic } from 'rxjs/operator/merge';
import { WindowsService } from 'services/windows';
import { SettingsService } from 'services/settings';
import {
  cpu as systemInfoCpu,
  graphics as systemInfoGraphics,
  osInfo as systemInfoOsInfo,
  uuid as systemInfoUuid,
} from 'systeminformation';
import {
  totalmem as nodeTotalMem,
  freemem as nodeFreeMem,
  cpus as nodeCpus,
  release as nodeOsRelease,
} from 'os';
import { memoryUsage as nodeMemUsage } from 'process';

// Eventually we will support authing multiple platforms at once
interface IUserServiceState {
  auth?: IPlatformAuth;
}

export class UserService extends PersistentStatefulService<IUserServiceState> {
  @Inject() hostsService: HostsService;
  @Inject() customizationService: CustomizationService;
  @Inject() appService: AppService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() windowsService: WindowsService;
  @Inject() settingsService: SettingsService;

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

  userLogin = new Subject<IPlatformAuth>();
  userLogout = new Subject<void>();
  userLoginState: Observable<IPlatformAuth | void> = mergeStatic(this.userLogin, this.userLogout);

  init() {
    super.init();
    this.setRavenContext();
    this.validateLogin().then(() => {
      this.updatePlatformUserInfo();
    });
  }

  mounted() {
    // This is used for faking authentication in tests
    electron.ipcRenderer.on(
      'testing-fakeAuth',
      (e: Electron.Event, auth: any) => {
        this.LOGIN(auth);
        this.setRavenContext();
      }
    );
  }

  // Makes sure the user's login is still good
  validateLogin(): Promise<void> {
    if (!this.isLoggedIn()) return Promise.resolve();

    console.log('validateLogin: this.platform=' + JSON.stringify(this.platform));
    const service = getPlatformService(this.platform.type);
    if (service && service.isLoggedIn) {
      return service.isLoggedIn().then(valid => {
        if (!valid) {
          this.LOGOUT();
          this.userLogout.next();
        }
      });
    }

    // ここに来るパターンは存在しないはず
    console.error('unexpected state: There is no proper instance of the platform service');
    this.LOGOUT();
    return Promise.resolve();
  }

  isLoggedIn() {
    return !!(this.state.auth && this.state.auth.apiToken);
  }

  /**
   * This is a uuid that persists across the application lifetime and uniquely
   * identifies this particular installation of N Air, even when the user is
   * not logged in.
   */
  getLocalUserId() {
    const localStorageKey = 'NAirLocalUserId';
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
  get userIcon() {
    if (this.isLoggedIn()) {
      return this.state.auth.platform.userIcon;
    }
  }
  get platformId() {
    if (this.isLoggedIn()) {
      return this.state.auth.platform.id;
    }
  }
  get platformUserPageURL() {
    if (this.isLoggedIn()) {
      const platform = getPlatformService(this.state.auth.platform.type);
      if (platform.getUserPageURL !== undefined) {
        return platform.getUserPageURL();
      }
      return '';
    }
  }

  get channelId() {
    if (this.isLoggedIn()) {
      return this.state.auth.platform.channelId;
    }
  }

  private async login(service: IPlatformService, auth: IPlatformAuth) {
    this.LOGIN(auth);
    this.userLogin.next(auth);
    this.setRavenContext();
    await this.sceneCollectionsService.setupNewUser();
  }

  async logOut() {
    // Attempt to sync scense before logging out
    this.appService.startLoading();

    // TODO niconico専用なので抽象化する
    getPlatformService('niconico').logout();

    await this.sceneCollectionsService.save();

    /* DEBUG
    await this.sceneCollectionsService.safeSync();
    */
    this.userLogout.next();
    this.LOGOUT();
    this.appService.finishLoading();
  }

  /**
   * Starts the authentication process.  Multiple callbacks
   * can be passed for various events.
   */
  startAuth(
    platform: TPlatform,
    onWindowShow: (...args: any[]) => any,
    onAuthStart: (...args: any[]) => any,
    onAuthCancel: (...args: any[]) => any,
    onAuthFinish: (...args: any[]) => any
  ) {
    const service = getPlatformService(platform);
    console.log('startAuth service = ' + JSON.stringify(service));

    const authWindow = new electron.remote.BrowserWindow({
      ...service.authWindowOptions,
      alwaysOnTop: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        nativeWindowOpen: true,
        sandbox: true
      }
    });

    authWindow.webContents.on('did-navigate', async (e, url) => {
      const parsed = this.parseAuthFromUrl(url);
      console.log('parsed = ' + JSON.stringify(parsed)); // DEBUG

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

    authWindow.once('close', () => {
      onAuthCancel();
    });

    authWindow.setMenu(null);
    authWindow.loadURL(service.authUrl);
  }

  /**
   * ユーザアイコンなどの情報だけ更新する
   * FIXME: validateLoginが成功した後にHTTPエラーが返ってくると説明なしにウィンドウが出てしまう
   */
  private updatePlatformUserInfo() {
    if (!this.isLoggedIn()) return;

    const service = getPlatformService(this.platform.type);

    const authWindow = new electron.remote.BrowserWindow({
      ...service.authWindowOptions,
      alwaysOnTop: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        nativeWindowOpen: true,
        sandbox: true
      }
    });

    authWindow.webContents.on('did-navigate', (e, url) => {
      const parsed = this.parseAuthFromUrl(url);

      if (parsed) {
        authWindow.close();
        this.LOGIN(parsed);
        this.userLogin.next(parsed);
        this.setRavenContext();
      } else {
        // 認可されていない場合は画面を出して操作可能にする
        authWindow.show();
      }
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
        apiToken: query.oauth_token,
        platform: {
          type: query.platform,
          username: query.platform_username,
          token: query.platform_token,
          id: query.platform_id,
          userIcon: query.platform_user_icon,
        }
      } as IPlatformAuth;
    }

    return false;
  }

  /**
   * Registers the current user information with Raven so
   * we can view more detailed information in sentry.
   */
  async setRavenContext() {
    if (!this.isLoggedIn()) return;
    Raven.setUserContext({ username: this.username, id: this.platformId });
    Raven.setExtraContext(await this.getUserExtraContext());
  }

  async getUserExtraContext() {
    try{
      const [graphics, cpu, osInfo, osUuid] = await Promise.all([
        systemInfoGraphics(),
        systemInfoCpu(),
        systemInfoOsInfo(),
        systemInfoUuid(),
      ]);

      return {
        platform: this.platform.type,
        cpuModel: nodeCpus()[0].model,
        cpuCores: `physical:${cpu.physicalCores} logical:${cpu.cores}`,
        gpus: graphics.controllers,
        os: `${osInfo.distro} ${osInfo.release}`,
        osUuid: osUuid.os,
        memTotal: nodeTotalMem(),
        memAvailable: nodeFreeMem(),
        memUsage: nodeMemUsage(),
      };
    } catch (err) {
      return {
        platform: this.platform.type,
        cpuModel: nodeCpus()[0].model,
        cpuCores: `logical:${nodeCpus().length}`,
        os: nodeOsRelease(),
        memTotal: nodeTotalMem(),
        memAvailable: nodeFreeMem(),
        memUsage: nodeMemUsage(),
        exceptionWhenGetSystemInfo: err
      };
    }
  }

  popoutRecentEvents() {
    this.windowsService.createOneOffWindow({
      componentName: 'RecentEvents',
      size: {
        width: 800,
        height: 600
      }
    }, 'RecentEvents');
  }

  async updateStreamSettings(programId: string = ''): Promise<IStreamingSetting> {
    return await getPlatformService(this.platform.type).setupStreamSettings(programId);
  }

  isNiconicoLoggedIn() {
    return this.isLoggedIn() && this.platform && this.platform.type === 'niconico';
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
        if (UserService.instance.isLoggedIn()) {
          return original.apply(target, args);
        }
      }
    };
  };
}
