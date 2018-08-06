import { PersistentStatefulService } from 'services/persistent-stateful-service';
import { mutation } from 'services/stateful-service';
import path from 'path';
import fs from 'fs';

/**
 * TODO
 */
enum EAppPermissions {
}

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
  supportList: string[];
  bannerImage?: string;
}

interface IAppSource {
  type: EAppSourceType;
  name: string;
  about: IAppSourceAbout;
  file: string; // Relative path to HTML file
}

enum EAppPageSlot {
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
  permissions: EAppPermissions[];
  sources: IAppSource[];
  pages: IAppPage[];
}

interface ILoadedApp {
  manifest: IAppManifest;
}

interface IPlatformAppServiceState {
  loadedApps: ILoadedApp[];
}

export class PlatformAppsService extends
  PersistentStatefulService<IPlatformAppServiceState> {

  /**
   * For now, there can only be 1 unpacked app at a time
   * TODO: Check this app for common structural problems
   */
  async installUnpackedApp(appPath: string) {
    const manifestData = await this.loadManifestFromDisk(path.join(appPath, 'manifest.json'));
    const manifest = JSON.parse(manifestData) as IAppManifest;
    this.ADD_APP({ manifest });
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

  /**
   * Replace for now
   * @param app the app
   */
  @mutation()
  private ADD_APP(app: ILoadedApp) {
    this.state.loadedApps = [app];
  }

}
