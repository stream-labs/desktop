import { Inject } from "services";
import { ILoadedApp } from ".";
import fs from 'fs';
import { AppService } from "app-services";
import { getAssetUrl } from "./container-manager";
import path from "path";
import uuid from 'uuid/v4';
import { IDownloadProgress, downloadFile } from "util/requests";
import os from 'os';

export class NativePackage {
  @Inject() appService: AppService;

  async ensureNativePackage(app: ILoadedApp, packageId: string, progressCallback?: (progress: IDownloadProgress) => void) {
    const packagePath = this.localPackagePath(app, packageId);

    if (!this.isLatestPackageExists(app, packageId)) {
      const url = this.packageUrl(app, packageId);

      await this.downloadPackage(url, progressCallback);
    }

    return packagePath;
  }

  isLatestPackageExists(app: ILoadedApp, packageId: string) {
    return fs.existsSync(this.localPackagePath(app, packageId));
  }

  localPackagePath(app: ILoadedApp, packageId: string) {
    const pkg = app.manifest.nativePackages.find(p => p.id === packageId);

    return path.join(this.appService.appDataDirectory, 'AppPlatformNative', app.id, pkg.file, pkg.version);
  }

  packageUrl(app: ILoadedApp, packageId: string) {
    const pkg = app.manifest.nativePackages.find(p => p.id === packageId);

    return getAssetUrl(app, pkg.file)
  }

  async downloadPackage(url: string, progressCallback?: (progress: IDownloadProgress) => void) {
    const packageFilename = `${uuid()}.zip`;
    const overlayPath = path.join(os.tmpdir(), packageFilename);

    await downloadFile(url, overlayPath, progressCallback);

    return overlayPath;
  }
}
