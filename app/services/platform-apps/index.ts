import { StatefulService } from 'services/stateful-service';
import { mutation } from 'services/stateful-service';
import path from 'path';
import fs from 'fs';
import { Subject } from 'rxjs/Subject';
import { WindowsService } from 'services/windows';
import { Inject } from 'util/injector';
import { EApiPermissions } from './api/modules/module';
import { PlatformAppsApi } from './api';
import { GuestApiService } from 'services/guest-api';
import { VideoService } from 'services/video';
import electron from 'electron';
import { DevServer } from './dev-server';
import url from 'url';
import { HostsService } from 'services/hosts';
import { handleErrors, authorizedHeaders } from 'util/requests';
import { UserService } from 'services/user';
import { trim, compact } from 'lodash';

const DEV_PORT = 8081;

/**
 * The type of source to create, for V1 only supports browser
 */
enum EAppSourceType {
  Browser = 'browser_source'
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
  Relative = 'relative'
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
  },
  redirectPropertiesToTopNavSlot: boolean;
}

export enum EAppPageSlot {
  TopNav = 'top_nav'
}

interface IAppPage {
  slot: EAppPageSlot;
  persistent?: boolean;
  allowPopout?: boolean; // Default true
  file: string; // Relative path to HTML file
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
  appToken: string;
  poppedOutSlots: EAppPageSlot[];
  appPath?: string;
  appUrl?: string;
  devPort?: number;
}

interface IPlatformAppServiceState {
  devMode: boolean;
  loadedApps: ILoadedApp[];
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

export class PlatformAppsService extends
  StatefulService<IPlatformAppServiceState> {

  @Inject() windowsService: WindowsService;
  @Inject() guestApiService: GuestApiService;
  @Inject() videoService: VideoService;
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  static initialState: IPlatformAppServiceState = {
    devMode: false,
    loadedApps: []
  };

  appLoad = new Subject<ILoadedApp>();
  appReload = new Subject<string>();
  appUnload = new Subject<string>();

  private localStorageKey = 'PlatformAppsUnpacked';

  apiManager = new PlatformAppsApi();

  devServer: DevServer;

  /**
   * Using initialize because it needs to be async
   */
  async initialize() {
    this.userService.userLogin.subscribe(async () => {
      this.unloadApps();
      this.SET_DEV_MODE(await this.getIsDevMode());
    });

    if (!this.userService.isLoggedIn()) return;

    this.SET_DEV_MODE(await this.getIsDevMode());

    this.installProductionApps();

    if (this.state.devMode && localStorage.getItem(this.localStorageKey)) {
      const data = JSON.parse(localStorage.getItem(this.localStorageKey));

      if (data.appPath && data.appToken) {
        console.log('loading unpacked: ', data);
        this.installUnpackedApp(data.appPath, data.appToken);
      }
    }
  }

  /**
   * Get production apps
   */
  async fetchProductionApps(): Promise<IProductionAppResponse[]> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(
      `https://${this.hostsService.platform}/api/v1/sdk/installed_apps`,
      { headers }
    );

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json())
  }

  /**
 * Install production apps
 */
  async installProductionApps() {
    const productionApps = await this.fetchProductionApps();
    productionApps.forEach(app => {
      if (app.is_beta && !app.manifest) return;
      this.addApp({
        id: app.id_hash,
        manifest: app.manifest,
        unpacked: false,
        appUrl: app.cdn_url,
        appToken: app.app_token,
        poppedOutSlots: []
      });
    });
  }

  /**
   * For now, there can only be 1 unpacked app at a time
   * TODO: Check this app for common structural problems
   */
  async installUnpackedApp(appPath: string, appToken: string) {
    const id = await this.getAppIdFromServer(appToken);

    if (id == null) {
      return 'Error: please check that your App Token is valid';
    }

    const manifestPath = path.join(appPath, 'manifest.json');

    if (!await this.fileExists(manifestPath)) {
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

    this.addApp({
      id,
      manifest,
      unpacked: true,
      appPath,
      appToken,
      devPort: DEV_PORT,
      poppedOutSlots: []
    });
  }

  addApp(app: ILoadedApp) {
    const { id, appToken } = app;
    this.ADD_APP(app);
    if (app.unpacked && app.appPath) {
      // store app in local storage
      localStorage.setItem(this.localStorageKey, JSON.stringify({
        appPath: app.appPath,
        appToken
      }));
    }
    this.appLoad.next(this.getApp(id));
  }

  async validateManifest(manifest: IAppManifest, appPath: string) {
    console.log('in validate manifest');
    // Validate top level of the manifest
    this.validateObject(manifest, 'manifest', [
      'name',
      'version',
      'permissions',
      'sources',
      'pages'
    ]);

    // Validate sources
    for (let i = 0; i < manifest.sources.length; i++) {
      const source = manifest.sources[i];

      this.validateObject(source, `manifest.sources[${i}]`, [
        'type',
        'name',
        'id',
        'about',
        'file'
      ]);

      // Validate about
      this.validateObject(source.about, `manifest.sources[${i}].about`, [
        'description'
      ]);

      // Check for existence of file
      const filePath = this.getFilePath(appPath, manifest.buildPath, source.file, true);
      const exists = await this.fileExists(filePath);

      if (!exists) {
        throw new Error(`Missing file: manifest.sources[${i}].file does not exist. Searching at path: ${filePath}`);
      }
    }

    // Validate pages
    // Only 1 page per slot top is allowed
    const seenSlots: Dictionary<boolean> = {};

    for (let i = 0; i < manifest.pages.length; i++) {
      const page = manifest.pages[i];

      this.validateObject(page, `manifest.pages[${i}]`, [
        'slot',
        'file'
      ]);

      if (seenSlots[page.slot]) {
        throw new Error(`Error: manifest.pages[${i}].slot "${page.slot}" ` +
          'is already taken. There can only be 1 page per slot.');
      }

      seenSlots[page.slot] = true;

      // Check for existence of file
      const filePath = this.getFilePath(appPath, manifest.buildPath, page.file, true);
      const exists = await this.fileExists(filePath);

      if (!exists) {
        throw new Error(`Missing file: manifest.pages[${i}].file does not exist. Searching at path: ${filePath}`);
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
    this.state.loadedApps.forEach(app => {
      this.REMOVE_APP(app.id);
      this.appUnload.next(app.id);
    });
    localStorage.removeItem(this.localStorageKey);
    // TODO: navigate to live if on that topnav tab

    if (this.devServer) {
      this.devServer.stopListening();
      this.devServer = null;
    }

  }

  async reloadApp(appId: string) {
    // TODO  Support Multiple Apps
    const app = this.getApp(appId);

    const manifestPath = path.join(app.appPath, 'manifest.json');

    if (!await this.fileExists(manifestPath)) {
      this.unloadApps();
      return 'Error: manifest.json is missing!';
    }

    const manifest = JSON.parse(await this.loadManifestFromDisk(manifestPath));

    try {
      await this.validateManifest(manifest, app.appPath);
    } catch (e) {
      this.unloadApps();
      return e.message;
    }

    this.UPDATE_APP_MANIFEST(
      appId,
      manifest
    );
    this.appReload.next(appId);
  }

  getAppIdFromServer(appToken: string): Promise<string> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(
      `https://${this.hostsService.platform}/api/v1/sdk/app_id?app_token=${appToken}`,
      { headers }
    );

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json())
      .then(json => json.id_hash);
  }

  getIsDevMode(): Promise<boolean> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(
      `https://${this.hostsService.platform}/api/v1/sdk/dev_mode`,
      { headers }
    );

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json())
      .then(json => json.dev_mode);
  }

  loadManifestFromDisk(manifestPath: string): Promise<string> {
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

  exposeAppApi(appId: string, webContentsId: number) { 
    const app = this.getApp(appId);
    const api = this.apiManager.getApi(app, app.manifest.permissions);

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
    const partition = `persist:platformApp-${appId}`;

    if (!this.sessionsInitialized[partition]) {
      const session = electron.remote.session.fromPartition(partition);
      const frameUrls: string[] = [];
      let mainFrame = '';

      session.webRequest.onBeforeRequest((details, cb) => {
        const parsed = url.parse(details.url);

        if (details.resourceType === 'mainFrame') mainFrame = url.parse(details.url).hostname;

        if ((parsed.hostname === 'cvp.twitch.tv') && (details.resourceType = 'script')) {
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
            'https://cdn.streamlabs.com/slobs-platform/lib/streamlabs-platform.min.js'
          ];

          const parsed = url.parse(details.url);


          if (scriptWhitelist.includes(details.url)) {
            cb({});
            return;
          }

          if (details.url.startsWith(app.appUrl)) {
            cb({});
            return;
          }

          if (parsed.host === `localhost:${DEV_PORT}`) {
            cb({});({});
            return;
          }

          // Let through all chrome dev tools requests
          if (parsed.protocol === 'chrome-devtools:') {
            cb({});
            return;
          }
          // Cancel all other script requests.
          // TODO: Handle production apps
          console.log('canceling', details);
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

  getPageUrlForSource(appId: string, appSourceId: string) {
    const app = this.getApp(appId);

    if (!app) return null;

    const source = app.manifest.sources.find(source => source.id === appSourceId);
    return this.getPageUrl(appId, source.file);
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
          height: source.initialSize.height
        }
      } else if (source.initialSize.type === ESourceSizeType.Relative) {
        return {
          width: source.initialSize.width * this.videoService.baseWidth,
          height: source.initialSize.height * this.videoService.baseHeight
        }
      }
    }

    // Default to 800x600
    return { width: 800, height: 600 };
  }

  getApp(appId: string) : ILoadedApp {
    return this.state.loadedApps.find(app => app.id === appId);
  }

  popOutAppPage(appId: string, pageSlot: EAppPageSlot) {
    // TODO Disable original page?

    const windowId =  `${appId}-${pageSlot}`;

    // We use a generated window Id to prevent someobody popping out the
    // same winow multiple times.
    this.windowsService.createOneOffWindow({
      componentName: 'PlatformAppPopOut',
      queryParams: { appId, pageSlot },
      size: {
        width: 600,
        height: 500
      }
    }, windowId);

    this.POP_OUT_SLOT(appId, pageSlot);

    const sub = this.windowsService.windowDestroyed.subscribe(winId => {
      if (winId === windowId) {
        this.POP_IN_SLOT(appId, pageSlot)
        sub.unsubscribe();
      }
    });
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
    this.state.loadedApps = this.state.loadedApps.filter(app => app.id !== appId);
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
  private POP_IN_SLOT(appId: string, slot:EAppPageSlot) {
    this.state.loadedApps.forEach(app => {
      if (app.id === appId) {
        app.poppedOutSlots = app.poppedOutSlots.filter(s => s !== slot);
      }
    });
  }

}
