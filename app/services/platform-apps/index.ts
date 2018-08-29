import { StatefulService } from 'services/stateful-service';
import { mutation } from 'services/stateful-service';
import path from 'path';
import fs from 'fs';
import { Subject } from 'rxjs/Subject';
import { WindowsService } from 'services/windows';
import { Inject } from 'util/injector';
import { EApiPermissions } from './api/modules/module';
import { PlatformAppsApi } from './api';

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

export interface IAppSource {
  type: EAppSourceType;
  id: string; // A unique id for this source
  name: string;
  about: IAppSourceAbout;
  file: string; // Relative path to HTML file
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
  id: string; // unique, e.g. com.streamlabs.alertbox
  name: string; // display name for the app
  version: string;
  permissions: EApiPermissions[];
  sources: IAppSource[];
  pages: IAppPage[];
}

interface ILoadedApp {
  manifest: IAppManifest;
  unpacked: boolean;
  appPath?: string; // The path on disk to the app if unpacked
  appToken: string;
}

interface IPlatformAppServiceState {
  loadedApps: ILoadedApp[];
}

export class PlatformAppsService extends
  StatefulService<IPlatformAppServiceState> {

  @Inject() windowsService: WindowsService;

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
    const manifestData = await this.loadManifestFromDisk(path.join(appPath, 'manifest.json'));
    const manifest = JSON.parse(manifestData) as IAppManifest;
    this.ADD_APP({ manifest, unpacked: true, appPath, appToken });
    localStorage.setItem(this.localStorageKey, JSON.stringify({
      appPath, appToken
    }));
    this.appLoad.next(this.getApp(manifest.id));
  }

  unloadApps() {
    this.state.loadedApps.forEach(app => {
      const appId = app.manifest.id;
      this.REMOVE_APP(appId);
      this.appUnload.next(appId);
    });
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

  getAppApi(appId: string) {
    const app = this.getApp(appId);
    return this.apiManager.getApi(app.manifest.permissions);
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
      url = `file://${path.join(app.appPath, asset)}`;
    } else {
      // TODO
    }

    return url;
  }

  getApp(appId: string) {
    return this.state.loadedApps.find(app => app.manifest.id === appId);
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
    this.state.loadedApps = this.state.loadedApps.filter(app => app.manifest.id !== appId);
  }

  @mutation()
  private UPDATE_APP_MANIFEST(appId: string, manifest: IAppManifest) {
    this.state.loadedApps.forEach(app => {
      if (app.manifest.id === appId) {
        app.manifest = manifest;
      }
    })
  }

}
