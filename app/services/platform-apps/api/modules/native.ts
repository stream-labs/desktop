import path from 'path';
import os from 'os';
import uuid from 'uuid/v4';
import fs from 'fs';
import { EApiPermissions, IApiContext, Module, apiMethod } from './module';
import { downloadFile, IDownloadProgress } from 'util/requests';
import { Inject } from 'services';
import { AppService, PlatformAppsService } from 'app-services';
import { ILoadedApp } from 'services/platform-apps';

export class NativeModule extends Module {
  readonly moduleName = 'Native';
  readonly permissions = [EApiPermissions.Native];

  @Inject() platformAppsService: PlatformAppsService;
  @Inject() appService: AppService;

  @apiMethod()
  installNativePackage(ctx: IApiContext, packageId: string) {

  }
}
