import { mutation, StatefulService } from 'services/stateful-service';
import path from 'path';
import fs from 'fs';
import { BehaviorSubject, Subject } from 'rxjs';
import { WindowsService } from 'services/windows';
import { Inject } from 'util/injector';
import { EApiPermissions, IWebviewTransform } from './api/modules/module';
import { PlatformAppsApi } from './api';
import { GuestApiService } from 'services/guest-api';
import { VideoService } from 'services/video';
import electron from 'electron';
import { DevServer } from './dev-server';
import url from 'url';
import { HostsService } from 'services/hosts';
import { authorizedHeaders, handleResponse } from 'util/requests';
import { UserService } from 'services/user';
import { compact, trim, without } from 'lodash';
import uuid from 'uuid/v4';

const DEV_PORT = 8081;

/**
 * The type of source to create, for V1 only supports browser
 */
enum EAppSourceType {
  Browser = 'browser_source',
}

/**
 * Presentational data for the sources showcase in SLOBS
 */
interface IAppSourceAbout {
  description: string;
  bullets: string[];
  bannerImage?: string;
}

enum ESourceSizeType {
  Absolute = 'absolute',
  Relative = 'relative',
}

export interface IAppSource {
  type: EAppSourceType;
  id: string; // A unique id for this source
  name: string;
  about: IAppSourceAbout;
  file: string; // Relative path to HTML file
  initialSize?: {
    type: ESourceSizeType;
    width: number;
    height: number;
  };
  redirectPropertiesToTopNavSlot: boolean;
}

export enum EAppPageSlot {
  TopNav = 'top_nav',
  Chat = 'chat',
}

interface IAppPage {
  slot: EAppPageSlot;
  persistent?: boolean;
  allowPopout?: boolean; // Default true
  file: string; // Relative path to HTML file
  popOutSize?: {
    width: number;
    height: number;
  };
}

interface IAppManifest {
  name: string;
  version: string;
  buildPath: string;
  permissions: EApiPermissions[];
  sources: IAppSource[];
  pages: IAppPage[];
  authorizationUrls: string[];
}

interface IProductionAppResponse {
  app_token: string;
  cdn_url: string;
  description: string;
  icon: string;
  id_hash: string;
  is_beta: boolean;
  manifest: IAppManifest;
  name: string;
  screenshots: string[];
  subscription: ISubscriptionResponse;
  version: string;
}

export interface ILoadedApp {
  id: string;
  manifest: IAppManifest;
  unpacked: boolean;
  beta: boolean;
  appToken: string;
  poppedOutSlots: EAppPageSlot[];
  appPath?: string;
  appUrl?: string;
  devPort?: number;
  icon?: string;
  enabled: boolean;
}

interface IPlatformAppServiceState {
  devMode: boolean;
  loadedApps: ILoadedApp[];
  storeVisible: boolean;
}

interface ISubscriptionResponse {
  id: number;
  user_id: number;
  app_id: number;
  subscription_id: string;
  status: string;
  plan_id: number;
  expires_at: string;
}

export class PlatformAppsService extends StatefulService<IPlatformAppServiceState> {
  @Inject() windowsService: WindowsService;
  @Inject() guestApiService: GuestApiService;
  @Inject() videoService: VideoService;
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  static initialState: IPlatformAppServiceState = {
    devMode: false,
    loadedApps: [],
    storeVisible: false,
  };

  appLoad = new Subject<ILoadedApp>();
  appReload = new Subject<string>();
  appUnload = new Subject<string>();

  private unpackedLocalStorageKey = 'PlatformAppsUnpacked';
  private disabledLocalStorageKey = 'PlatformAppsDisabled';

  // Lazy initialize the API
  private _apiManager: PlatformAppsApi;
  private get apiManager() {
    if (!this._apiManager) this._apiManager = new PlatformAppsApi();
    return this._apiManager;
  }

  private devServer: DevServer;

  /**
   * Using initialize because it needs to be async
   */
  async initialize() {
    this.userService.userLogin.subscribe(async () => {
      this.unloadApps();
      this.installProductionApps();
      this.SET_APP_STORE_VISIBILITY(await this.fetchAppStoreVisibility());
      this.SET_DEV_MODE(await this.getIsDevMode());
    });

    if (!this.userService.isLoggedIn()) return;

    this.SET_DEV_MODE(await this.getIsDevMode());

    this.installProductionApps();
    this.SET_APP_STORE_VISIBILITY(await this.fetchAppStoreVisibility());

    if (this.state.devMode && localStorage.getItem(this.unpackedLocalStorageKey)) {
      const data = JSON.parse(localStorage.getItem(this.unpackedLocalStorageKey));
      if (data.appPath && data.appToken) {
        this.installUnpackedApp(data.appPath, data.appToken);
      }
    }
  }

  /**
   * Get production apps
   */
  async fetchProductionApps(): Promise<IProductionAppResponse[]> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(`https://${this.hostsService.platform}/api/v1/sdk/installed_apps`, {
      headers,
    });

    return fetch(request)
      .then(handleResponse)
      .catch(() => []);
  }

  getDisabledAppsFromStorage(): string[] {
    const disabledAppsStr = localStorage.getItem(this.disabledLocalStorageKey);
    return disabledAppsStr ? JSON.parse(disabledAppsStr) : [];
  }

  /**
   * Install production apps
   */
  async installProductionApps() {
    if (this.userService.platform.type !== 'twitch') return;

    const productionApps = await this.fetchProductionApps();

    const disabledApps = this.getDisabledAppsFromStorage();

    productionApps.forEach(app => {
      if (app.is_beta && !app.manifest) return;

      const unpackedVersionLoaded = this.state.loadedApps.find(
        loadedApp => loadedApp.id === app.id_hash,
      );

      this.addApp({
        id: app.id_hash,
        manifest: app.manifest,
        unpacked: false,
        beta: app.is_beta,
        appUrl: app.cdn_url,
        appToken: app.app_token,
        poppedOutSlots: [],
        icon: app.icon,
        enabled: !(unpackedVersionLoaded || disabledApps.includes(app.id_hash)),
      });
    });
  }

  fetchAppStoreVisibility(): Promise<boolean> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(
      `https://${this.hostsService.platform}/api/v1/sdk/is_app_store_visible`,
      { headers },
    );

    return fetch(request)
      .then(handleResponse)
      .then(json => json.is_app_store_visible)
      .catch(() => false);
  }

  /**
   * For now, there can only be 1 unpacked app at a time
   */
  async installUnpackedApp(appPath: string, appToken: string) {
    const id = await this.getAppIdFromServer(appToken);

    if (id == null) {
      return 'Error: please check that your App Token is valid';
    }

    const manifestPath = path.join(appPath, 'manifest.json');

    if (!(await this.fileExists(manifestPath))) {
      return 'Error: manifest.json is missing!';
    }

    const manifestData = await this.loadManifestFromDisk(manifestPath);
    const manifest = JSON.parse(manifestData) as IAppManifest;

    try {
      await this.validateManifest(manifest, appPath);
    } catch (e) {
      return e.message;
    }

    // Make sure there isn't already a dev server
    if (this.devServer) {
      this.devServer.stopListening();
      this.devServer = null;
    }

    this.devServer = new DevServer(appPath, DEV_PORT);

    if (this.state.loadedApps.find(loadedApp => loadedApp.id === id && !loadedApp.unpacked)) {
      // has prod app with same id
      // disable prod app
      this.SET_PROD_APP_ENABLED(id, false);
    }

    this.addApp({
      id,
      manifest,
      appPath,
      appToken,
      unpacked: true,
      beta: false,
      devPort: DEV_PORT,
      poppedOutSlots: [],
      enabled: true,
    });
  }

  get enabledApps() {
    return this.state.loadedApps.filter(app => app.enabled);
  }

  get productionApps() {
    return this.state.loadedApps.filter(app => !app.unpacked);
  }

  addApp(app: ILoadedApp) {
    const { id, appToken } = app;
    if (
      this.state.loadedApps.find(
        loadedApp => loadedApp.id === app.id && loadedApp.unpacked === app.unpacked,
      )
    ) {
      return;
    }

    this.ADD_APP(app);
    if (app.unpacked && app.appPath) {
      // store app in local storage
      localStorage.setItem(
        this.unpackedLocalStorageKey,
        JSON.stringify({
          appToken,
          appPath: app.appPath,
        }),
      );
    }
    this.appLoad.next(this.getApp(id));
  }

  async validateManifest(manifest: IAppManifest, appPath: string) {
    // Validate top level of the manifest
    this.validateObject(manifest, 'manifest', [
      'name',
      'version',
      'permissions',
      'sources',
      'pages',
    ]);

    // Validate sources
    for (let i = 0; i < manifest.sources.length; i++) {
      const source = manifest.sources[i];

      this.validateObject(source, `manifest.sources[${i}]`, [
        'type',
        'name',
        'id',
        'about',
        'file',
      ]);

      // Validate about
      this.validateObject(source.about, `manifest.sources[${i}].about`, ['description']);

      // Check for existence of file
      const filePath = this.getFilePath(appPath, manifest.buildPath, source.file, true);
      const exists = await this.fileExists(filePath);

      if (!exists) {
        throw new Error(
          `Missing file: manifest.sources[${i}].file does not exist. Searching at path: ${filePath}`,
        );
      }
    }

    // Validate pages
    // Only 1 page per slot top is allowed
    const seenSlots: Dictionary<boolean> = {};

    for (let i = 0; i < manifest.pages.length; i++) {
      const page = manifest.pages[i];

      this.validateObject(page, `manifest.pages[${i}]`, ['slot', 'file']);

      if (seenSlots[page.slot]) {
        throw new Error(
          `Error: manifest.pages[${i}].slot "${page.slot}" ` +
            'is already taken. There can only be 1 page per slot.',
        );
      }

      seenSlots[page.slot] = true;

      // Check for existence of file
      const filePath = this.getFilePath(appPath, manifest.buildPath, page.file, true);
      const exists = await this.fileExists(filePath);

      if (!exists) {
        throw new Error(
          `Missing file: manifest.pages[${i}].file does not exist. Searching at path: ${filePath}`,
        );
      }
    }
  }

  getFilePath(appPath: string, buildPath: string, file: string, isUnpacked = false) {
    if (isUnpacked) {
      return path.join(appPath, trim(buildPath), file);
    }
    return path.join(appPath, file);
  }

  validateObject(obj: Dictionary<any>, objName: string, requiredFields: string[]) {
    requiredFields.forEach(field => {
      if (obj[field] == null) {
        throw new Error(`Missing property: ${objName} is missing required field "${field}"`);
      }
    });
  }

  fileExists(filePath: string): Promise<boolean> {
    return new Promise(resolve => {
      fs.exists(filePath, exists => resolve(exists));
    });
  }

  unloadApps() {
    this.state.loadedApps.forEach(app => this.unloadApp(app));
  }

  unloadApp(app: ILoadedApp) {
    this.REMOVE_APP(app.id);
    if (app.unpacked) {
      localStorage.removeItem(this.unpackedLocalStorageKey);
      if (this.devServer) {
        this.devServer.stopListening();
        this.devServer = null;
      }
    }
    this.appUnload.next(app.id);
  }

  async reloadApp(appId: string) {
    const app = this.getApp(appId);

    if (!app.unpacked) {
      this.appReload.next(appId);
      return;
    }
    const manifestPath = path.join(app.appPath, 'manifest.json');

    if (!(await this.fileExists(manifestPath))) {
      this.unloadApp(app);
      return 'Error: manifest.json is missing!';
    }

    const manifest = JSON.parse(await this.loadManifestFromDisk(manifestPath));

    try {
      await this.validateManifest(manifest, app.appPath);
    } catch (e) {
      this.unloadApps();
      return e.message;
    }

    this.UPDATE_APP_MANIFEST(appId, manifest);
    this.appReload.next(appId);
  }

  getAppIdFromServer(appToken: string): Promise<string> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(
      `https://${this.hostsService.platform}/api/v1/sdk/app_id?app_token=${appToken}`,
      { headers },
    );

    return fetch(request)
      .then(handleResponse)
      .then(json => json.id_hash)
      .catch(() => null);
  }

  private getIsDevMode(): Promise<boolean> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(`https://${this.hostsService.platform}/api/v1/sdk/dev_mode`, {
      headers,
    });

    return fetch(request)
      .then(handleResponse)
      .then(json => json.dev_mode)
      .catch(() => false);
  }

  private loadManifestFromDisk(manifestPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(manifestPath, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data.toString());
      });
    });
  }

  exposeAppApi(
    appId: string,
    webContentsId: number,
    electronWindowId: number,
    slobsWindowId: string,
    transformSubjectId: string,
  ) {
    const app = this.getApp(appId);
    const api = this.apiManager.getApi(
      app,
      webContentsId,
      electronWindowId,
      slobsWindowId,
      this.getTransformSubject(transformSubjectId),
    );

    // Namespace under v1 for now.  Eventually we may want to add
    // a v2 API.
    this.guestApiService.exposeApi(webContentsId, { v1: api });
  }

  sessionsInitialized: Dictionary<boolean> = {};

  /**
   * Returns a session partition id for the app id.
   * These are non-persistent for now
   */
  getAppPartition(appId: string) {
    const app = this.getApp(appId);
    const userId = this.userService.platformId;
    const partition = `platformApp-${appId}-${userId}`;

    if (!this.sessionsInitialized[partition]) {
      const session = electron.remote.session.fromPartition(partition);
      const frameUrls: string[] = [];
      let mainFrame = '';

      session.webRequest.onBeforeRequest((details, cb) => {
        const parsed = url.parse(details.url);

        if (details.resourceType === 'mainFrame') mainFrame = url.parse(details.url).hostname;

        if (parsed.hostname === 'cvp.twitch.tv' && (details.resourceType = 'script')) {
          cb({});
          return;
        }

        if (details.resourceType === 'subFrame') {
          // Subframes from other origins are allowed to load scripts.  The same origin
          // policy will prevent them from accessing the parent window.
          if (parsed.hostname !== mainFrame) {
            frameUrls.push(details.url);
            cb({});
            return;
          }
        }

        if (details['referrer'] && frameUrls.includes(details['referrer'])) {
          cb({});
          return;
        }

        if (details.resourceType === 'script') {
          const scriptWhitelist = [
            'https://cdn.streamlabs.com/slobs-platform/lib/streamlabs-platform.js',
            'https://cdn.streamlabs.com/slobs-platform/lib/streamlabs-platform.min.js',
          ];

          const scriptDomainWhitelist = [
            'www.googletagmanager.com',
            'www.google-analytics.com',
            'widget.intercom.io',
            'js.intercomcdn.com',
          ];

          const parsed = url.parse(details.url);

          if (scriptWhitelist.includes(details.url)) {
            cb({});
            return;
          }

          if (scriptDomainWhitelist.includes(parsed.hostname)) {
            cb({});
            return;
          }

          if (details.url.startsWith(app.appUrl)) {
            cb({});
            return;
          }

          if (parsed.host === `localhost:${DEV_PORT}`) {
            cb({});
            return;
          }

          // Let through all chrome dev tools requests
          if (parsed.protocol === 'chrome-devtools:') {
            cb({});
            return;
          }

          // Cancel all other script requests.
          cb({ cancel: true });
          return;
        }

        // Let through all other requests (XHR, assets, etc)
        cb({});
      });

      this.sessionsInitialized[partition] = true;
    }

    return partition;
  }

  getPageUrlForSlot(appId: string, slot: EAppPageSlot) {
    const app = this.getApp(appId);
    const page = app.manifest.pages.find(page => page.slot === slot);
    if (!page) return null;

    return this.getPageUrl(appId, page.file);
  }

  isAppSlotPersistent(appId: string, slot: EAppPageSlot) {
    const app = this.getApp(appId);
    if (!app) return false;

    const page = app.manifest.pages.find(page => page.slot === slot);
    if (!page) return false;

    return !!page.persistent;
  }

  getPageUrlForSource(appId: string, appSourceId: string, settings = '') {
    const app = this.getApp(appId);

    if (!app) return null;

    const source = app.manifest.sources.find(source => source.id === appSourceId);
    let url = this.getPageUrl(appId, source.file);

    if (settings) {
      url = `${url}&settings=${encodeURIComponent(settings)}`;
    }

    url = `${url}&source=true`;

    return url;
  }

  getPageUrl(appId: string, page: string) {
    const app = this.getApp(appId);
    const url = this.getAssetUrl(appId, page);
    return `${url}?app_token=${app.appToken}`;
  }

  getAssetUrl(appId: string, asset: string) {
    const app = this.getApp(appId);
    let url: string;

    if (app.unpacked) {
      const trimmed = trim(app.manifest.buildPath, '/ ');
      url = compact([`http://localhost:${app.devPort}`, trimmed, asset]).join('/');
    } else {
      url = compact([app.appUrl, asset]).join('/');
    }

    return url;
  }

  getAppSourceSize(appId: string, sourceId: string) {
    const app = this.getApp(appId);
    const source = app.manifest.sources.find(source => source.id === sourceId);

    if (source.initialSize) {
      if (source.initialSize.type === ESourceSizeType.Absolute) {
        return {
          width: source.initialSize.width,
          height: source.initialSize.height,
        };
        // tslint:disable-next-line:no-else-after-return TODO
      } else if (source.initialSize.type === ESourceSizeType.Relative) {
        return {
          width: source.initialSize.width * this.videoService.baseWidth,
          height: source.initialSize.height * this.videoService.baseHeight,
        };
      }
    }

    // Default to 800x600
    return { width: 800, height: 600 };
  }

  getPagePopOutSize(appId: string, slot: EAppPageSlot) {
    const app = this.getApp(appId);
    const page = app.manifest.pages.find(page => page.slot === slot);
    if (page.popOutSize) {
      return {
        width: page.popOutSize.width,
        height: page.popOutSize.height,
      };
    }

    // Default to 600x500
    return { width: 600, height: 500 };
  }

  getProductionApps() {
    return this.state.loadedApps.filter(app => !app.unpacked);
  }

  getApp(appId: string): ILoadedApp {
    // edge case for when there are 2 apps with same id
    // when one is unpacked and one is prod
    // generally we want to do actions with enabled one first
    const enabledApp = this.state.loadedApps.find(app => app.id === appId && app.enabled);
    if (enabledApp) return enabledApp;
    return this.state.loadedApps.find(app => app.id === appId);
  }

  popOutAppPage(appId: string, pageSlot: EAppPageSlot) {
    const app = this.getApp(appId);
    if (!app || !app.enabled) return;

    const windowId = `${appId}-${pageSlot}`;

    // We use a generated window Id to prevent someobody popping out the
    // same winow multiple times.
    this.windowsService.createOneOffWindow(
      {
        componentName: 'PlatformAppPopOut',
        queryParams: { appId, pageSlot },
        title: app.manifest.name,
        size: this.getPagePopOutSize(appId, pageSlot),
      },
      windowId,
    );

    this.POP_OUT_SLOT(appId, pageSlot);

    const sub = this.windowsService.windowDestroyed.subscribe(winId => {
      if (winId === windowId) {
        this.POP_IN_SLOT(appId, pageSlot);
        sub.unsubscribe();
      }
    });
  }

  setEnabled(appId: string, enabling: boolean) {
    const app = this.getApp(appId);
    if (app.enabled === enabling) return;

    if (enabling) {
      this.appLoad.next(app);
      localStorage.setItem(
        this.disabledLocalStorageKey,
        JSON.stringify(without(this.getDisabledAppsFromStorage(), app.id)),
      );
    } else {
      this.appUnload.next(appId);
      localStorage.setItem(
        this.disabledLocalStorageKey,
        JSON.stringify(this.getDisabledAppsFromStorage().concat([app.id])),
      );
    }
    this.SET_PROD_APP_ENABLED(appId, enabling);
  }

  /* These functions exist primary to work around our n window
   * system because rxjs subjects are not serializable
   */

  transformSubjects: Dictionary<BehaviorSubject<IWebviewTransform>> = {};

  createTransformSubject(initial: IWebviewTransform) {
    const id = uuid();
    this.transformSubjects[id] = new BehaviorSubject(initial);
    return id;
  }

  getTransformSubject(id: string) {
    return this.transformSubjects[id];
  }

  removeTransformSubject(id: string) {
    delete this.transformSubjects[id];
  }

  nextTransformSubject(id: string, value: IWebviewTransform) {
    this.transformSubjects[id].next(value);
  }

  /**
   * Replace for now
   * @param app the app
   */
  @mutation()
  private ADD_APP(app: ILoadedApp) {
    this.state.loadedApps.push(app);
  }

  @mutation()
  private REMOVE_APP(appId: string) {
    // edge case for when there are 2 apps with same id
    // when one is unpacked and one is prod
    // generally we want to do actions with enabled one first
    if (this.state.loadedApps.find(app => app.id === appId && app.enabled)) {
      this.state.loadedApps = this.state.loadedApps.filter(app => app.id !== appId || !app.enabled);
    } else {
      this.state.loadedApps = this.state.loadedApps.filter(app => app.id !== appId);
    }
  }

  @mutation()
  private UPDATE_APP_MANIFEST(appId: string, manifest: IAppManifest) {
    this.state.loadedApps.forEach(app => {
      if (app.id === appId) {
        app.manifest = manifest;
      }
    });
  }

  @mutation()
  private SET_DEV_MODE(devMode: boolean) {
    this.state.devMode = devMode;
  }

  @mutation()
  private POP_OUT_SLOT(appId: string, slot: EAppPageSlot) {
    this.state.loadedApps.forEach(app => {
      if (app.id === appId) {
        app.poppedOutSlots.push(slot);
      }
    });
  }

  @mutation()
  private POP_IN_SLOT(appId: string, slot: EAppPageSlot) {
    this.state.loadedApps.forEach(app => {
      if (app.id === appId) {
        app.poppedOutSlots = app.poppedOutSlots.filter(s => s !== slot);
      }
    });
  }

  @mutation()
  private SET_APP_STORE_VISIBILITY(visibility: boolean) {
    this.state.storeVisible = visibility;
  }

  @mutation()
  private SET_PROD_APP_ENABLED(appId: string, enabled: boolean) {
    this.state.loadedApps.forEach(app => {
      if (app.id === appId && !app.unpacked) {
        app.enabled = enabled;
      }
    });
  }
}
