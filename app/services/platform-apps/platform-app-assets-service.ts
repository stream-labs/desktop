import Vue from 'vue';
import electron from 'electron';
import path from 'path';
import util from 'util';
import mkdirpModule from 'mkdirp';
import { tmpdir } from 'os';
import fs from 'fs';
import { mutation } from '../stateful-service';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { ILoadedApp, PlatformAppsService } from './index';
import { TransitionsService } from '../transitions';
import { Inject } from 'util/injector';
import { downloadFileAlt, getChecksum } from 'util/requests';
import { InitAfter } from 'util/service-observer';

const mkdirp = util.promisify(mkdirpModule);
const mkdtemp = util.promisify(fs.mkdtemp);
const copyFile = util.promisify(fs.copyFile);

type Checksum = string;

// prettier-ignore
type ResourceType = |
  'transition';

/**
 * Maintains a lookup table of asset filenames to checksum mappings, grouped by app ID.
 *
 * @see {AssetsMap}
 */
export interface AssetsServiceState {
  [appId: string]: AssetsMap;
}

export interface AssetsMap {
  // asset filename -> asset
  [assetFilename: string]: Asset;
}

export interface Asset {
  checksum: Checksum;
  resourceId?: string;
  resourceType?: ResourceType;
  originalUrl?: string;
}

export interface AssetUpdateInfo extends Asset {
  oldFile: string;
  newFile: string;
  newChecksum: string;
  assetName: string;
}

/**
 * Manage and download assets provided by platform apps.
 *
 * This is initially designed to download stinger transition files
 */
@InitAfter('PlatformAppsService')
export class PlatformAppAssetsService extends PersistentStatefulService<AssetsServiceState> {
  @Inject() private platformAppsService: PlatformAppsService;
  @Inject() private transitionsService: TransitionsService;

  static defaultState: AssetsServiceState = {};

  init() {
    super.init();

    this.platformAppsService.appLoad.subscribe((app: ILoadedApp) => {
      this.updateAppAssets(app.id);
    });
  }

  /**
   * Get a specific asset
   *
   * @param appId Application ID
   * @param assetName Asset filename
   */
  getAsset(appId: string, assetName: string): Asset | null {
    const appAssets = this.state[appId];

    return appAssets ? appAssets[assetName] : null;
  }

  /**
   * Returns whether we have downloaded an asset before
   *
   * @param appId Application ID
   * @param assetName Asset filename
   */
  hasAsset(appId: string, assetName: string) {
    return !!this.getAsset(appId, assetName);
  }

  /**
   * Add a platform app asset, download and calculate checksum
   *
   * @param appId Application ID
   * @param assetUrl Original asset URL
   * @returns Path to the downloaded asset on disk
   * @see {ADD_ASSET}
   */
  async addPlatformAppAsset(appId: string, assetUrl: string) {
    const originalUrl = this.platformAppsService.getAssetUrl(appId, assetUrl);

    const assetsDir = await this.getAssetsTargetDirectory(appId);
    const filePath = path.join(assetsDir, path.basename(originalUrl));

    await downloadFileAlt(originalUrl, filePath);

    const checksum = await getChecksum(filePath);

    this.ADD_ASSET(appId, assetUrl, checksum);

    return filePath;
  }

  /**
   * Update app assets
   *
   * Downloads every app asset to tmp, compares the checksums, and if changed
   * unsets the resource where it's being used, prior to moving it to its original location
   * and updating the checksum
   *
   * @param appId: Application ID
   */
  async updateAppAssets(appId: string) {
    const assets = this.state[appId];
    if (!assets) {
      return;
    }

    const files = Object.keys(assets).map(assetName => {
      const { checksum: oldChecksum, originalUrl } = assets[assetName];
      return {
        assetName,
        oldChecksum,
        originalUrl,
      };
    });

    const tmpDir = await mkdtemp(path.join(tmpdir(), `slobs-${appId}-`));

    const assetsToUpdate = await Promise.all(
      files.map(async asset => {
        const tmpFile = path.join(tmpDir, asset.assetName);

        await downloadFileAlt(asset.originalUrl, tmpFile);

        return {
          ...assets[asset.assetName],
          assetName: asset.assetName,
          newChecksum: await getChecksum(tmpFile),
          oldFile: path.join(await this.getAssetsTargetDirectory(appId), asset.assetName),
          newFile: tmpFile,
        };
      }),
    ).then(([...assets]) => assets.filter(asset => asset.checksum !== asset.newChecksum));

    assetsToUpdate.forEach(async asset => {
      await this.updateAssetResource(appId, asset);
    });
  }

  /**
   * Get the directory where we should place downloaded files for this app
   *
   * @param appId Application ID
   */
  async getAssetsTargetDirectory(appId: string): Promise<string> {
    return ensureAssetsDir(this.getApp(appId));
  }

  /**
   * Associate an asset with a resource (such as a transition)
   *
   * @param appId Application ID
   * @param assetUrl The asset name
   * @param originalUrl The original relative url
   * @param resourceType Type of resource, currently only transitions supported
   * @param resourceId ID of the resource
   * @see {LINK_ASSET}
   */
  linkAsset(
    appId: string,
    assetUrl: string,
    originalUrl: string,
    resourceType: ResourceType,
    resourceId: string,
  ): void {
    this.LINK_ASSET(
      appId,
      assetUrl,
      this.platformAppsService.getAssetUrl(appId, originalUrl),
      resourceType,
      resourceId,
    );
  }

  @mutation()
  private ADD_ASSET(appId: string, assetName: string, checksum: string): void {
    if (!this.state[appId]) {
      Vue.set(this.state, appId, {});
    }

    Vue.set(this.state[appId], assetName, { checksum });
  }

  @mutation()
  private LINK_ASSET(
    appId: string,
    assetUrl: string,
    originalUrl: string,
    resourceType: ResourceType,
    resourceId: string,
  ) {
    const assetName = path.basename(assetUrl);
    const asset = this.getAsset(appId, assetName);

    if (asset) {
      Vue.set(asset, 'resourceId', resourceId);
      Vue.set(asset, 'resourceType', resourceType);
      Vue.set(asset, 'originalUrl', originalUrl);
    }
  }

  private updateChecksum(appId: string, assetName: string, checksum: Checksum) {
    this.UPDATE_CHECKSUM(appId, assetName, checksum);
  }

  @mutation()
  private UPDATE_CHECKSUM(appId: string, assetId: string, checksum: Checksum): void {
    this.state[appId][assetId].checksum = checksum;
  }

  private getApp(appId: string): ILoadedApp {
    const app = this.platformAppsService.getApp(appId);

    if (!app) {
      throw new Error(`Invalid app: ${appId}`);
    }

    return app;
  }

  /**
   * Update an asset by releasing its resource, copying the file to the old location
   * and updating the checksum
   * @param appId Application ID
   * @param asset Update information for the asset
   */
  private async updateAssetResource(appId: string, asset: AssetUpdateInfo) {
    if (asset.resourceType !== 'transition') {
      throw new Error('Not implemented');
    }

    this.updateTransitionPath(asset.resourceId, '');

    await copyFile(asset.newFile, asset.oldFile);

    this.updateTransitionPath(asset.resourceId, asset.oldFile);

    this.updateChecksum(appId, asset.assetName, asset.newChecksum);
  }

  private updateTransitionPath(transitionId: string, path: string) {
    const settings = this.transitionsService
      .getPropertiesFormData(transitionId)
      .map(setting => (setting.name === 'path' ? { ...setting, path } : setting));

    this.transitionsService.setPropertiesFormData(transitionId, settings);
  }
}

/**
 * Ensure the App instance has an assets key and that the assets directory exist
 *
 * @param app App instance
 * @returns Assets directory path for this app
 */
const ensureAssetsDir = async (app: ILoadedApp): Promise<string> => {
  const appAssetsDir = path.join(
    // prettier-ignore
    electron.remote.app.getPath('userData'),
    'Media',
    'Apps',
    app.id,
  );

  await mkdirp(appAssetsDir);

  return appAssetsDir;
};
