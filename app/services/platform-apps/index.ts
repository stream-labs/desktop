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
  }
}

export enum EAppPageSlot {
  TopNav = 'top_nav'
}

interface IAppPage {
  slot: EAppPageSlot;
  persistent?: boolean;
  file: string; // Relative path to HTML file
}

interface IAppManifest {
  name: string; // display name for the app
  version: string;
  permissions: EApiPermissions[];
  sources: IAppSource[];
  pages: IAppPage[];
}

interface ILoadedApp {
  id: string;
  manifest: IAppManifest;
  unpacked: boolean;
  appPath?: string; // The path on disk to the app if unpacked
  appToken: string;
  devPort?: number; // The port the dev server is running on if unpacked
}

interface IPlatformAppServiceState {
  loadedApps: ILoadedApp[];
}

export class PlatformAppsService extends
  StatefulService<IPlatformAppServiceState> {

  @Inject() windowsService: WindowsService;
  @Inject() guestApiService: GuestApiService;
  @Inject() videoService: VideoService;
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;

  static initialState: IPlatformAppServiceState = {
    loadedApps: []
  };

  appLoad = new Subject<ILoadedApp>();
  appReload = new Subject<string>();
  appUnload = new Subject<string>();

  // TODO: Gate this to a whitelist
  devMode = true;

  private localStorageKey = 'PlatformAppsUnpacked';

  apiManager = new PlatformAppsApi();

  devServer: DevServer;

  init() {
    if (localStorage.getItem(this.localStorageKey)) {
      const data = JSON.parse(localStorage.getItem(this.localStorageKey));

      if (data.appPath && data.appToken) {
        this.installUnpackedApp(data.appPath, data.appToken);
      }
    }
  }

  /**
   * For now, there can only be 1 unpacked app at a time
   * TODO: Check this app for common structural problems
   */
  async installUnpackedApp(appPath: string, appToken: string) {
    const id = await this.getAppIdFromServer(appToken);
    const manifestData = await this.loadManifestFromDisk(path.join(appPath, 'manifest.json'));
    const manifest = JSON.parse(manifestData) as IAppManifest;

    // Make sure there isn't already a dev server
    if (this.devServer) {
      this.devServer.stopListening();
      this.devServer = null;
    }

    this.devServer = new DevServer(appPath, DEV_PORT);

    this.ADD_APP({
      id,
      manifest,
      unpacked: true,
      appPath,
      appToken,
      devPort: DEV_PORT
    });
    localStorage.setItem(this.localStorageKey, JSON.stringify({
      appPath, appToken
    }));
    this.appLoad.next(this.getApp(id));
  }

  unloadApps() {
    this.state.loadedApps.forEach(app => {
      const appId = app.id;
      this.REMOVE_APP(appId);
      this.appUnload.next(appId);
    });

    if (this.devServer) {
      this.devServer.stopListening();
      this.devServer = null;
    }

    localStorage.removeItem(this.localStorageKey);
  }

  async reloadApp(appId: string) {
    // TODO Support Multiple Apps
    const app = this.getApp(appId);
    this.UPDATE_APP_MANIFEST(
      appId,
      JSON.parse(await this.loadManifestFromDisk(path.join(app.appPath, 'manifest.json')))
    );
    this.appReload.next(appId);
  }

  getAppIdFromServer(appToken: string): Promise<string> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(
      `https://${this.hostsService.devPlatform}/api/v1/sdk/app_id?app_token=${appToken}`,
      { headers }
    );

    return fetch(request)
      .then(handleErrors)
      .then(res => res.json())
      .then(json => json.id_hash);
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
    const api = this.apiManager.getApi(app.manifest.permissions);
    this.guestApiService.exposeApi(webContentsId, api);
  }

  sessionsInitialized: Dictionary<boolean> = {};

  /**
   * Returns a session partition id for the app id.
   * These are non-persistent for now
   */
  getAppPartition(appId: string) {
    const partition = `platformApp-${appId}`;

    if (!this.sessionsInitialized[partition]) {
      const session = electron.remote.session.fromPartition(partition);

      session.webRequest.onBeforeRequest((details, cb) => {
        console.log('Request', details);

        if (details.resourceType === 'script') {
          if (details.url === 'https://cdn.streamlabs.com/slobs-platform/lib/streamlabs-platform.js') {
            cb({});
            return;
          }

          const parsed = url.parse(details.url);

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
          // TODO: Handle production apps
          console.log('canceling', parsed);
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
    return this.getPageUrl(appId, page.file);
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
      url = `http://localhost:${app.devPort}/${asset}`;
    } else {
      // TODO
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

  getApp(appId: string) {
    return this.state.loadedApps.find(app => app.id === appId);
  }

  popOutAppPage(appId: string, pageSlot: EAppPageSlot) {
    // TODO Disable original page?

    // We use a generated window Id to prevent someobody popping out the
    // same winow multiple times.
    this.windowsService.createOneOffWindow({
      componentName: 'PlatformAppPopOut',
      queryParams: { appId, pageSlot },
      size: {
        width: 600,
        height: 500
      }
    }, `${appId}-${pageSlot}`);
  }

  /**
   * Replace for now
   * @param app the app
   */
  @mutation()
  private ADD_APP(app: ILoadedApp) {
    this.state.loadedApps = [app];
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
    })
  }

}
