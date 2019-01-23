import { Service } from './service';
import fs from 'fs';
import path from 'path';
import electron from 'electron';
import * as obs from '../../obs-api';

export class ObsUserPluginsService extends Service {
  async initialize() {
    // Make a best effort but don't stop SLOBS from loading
    try {
      await this.ensureDirectory(this.pluginsBaseDir);
      await this.ensureDirectory(this.obsPluginsDir);
      await this.ensureDirectory(this.pluginsDir);
      await this.ensureDirectory(this.dataBaseDir);
      await this.ensureDirectory(this.dataDir);
    } catch (e) {
      console.error('Error creating plugin directories', e);
    }
  }

  async initializeModule(dllFile: string) {
    const name = path.parse(dllFile).name;
    const dataDir = path.join(this.dataDir, name);
    await this.ensureDirectory(dataDir);
    const module = obs.ModuleFactory.open(path.join(this.pluginsDir, dllFile), dataDir);
    module.initialize();
  }

  // The 2 public paths

  get pluginsDir() {
    return path.join(this.obsPluginsDir, '64bit');
  }

  get dataDir() {
    return path.join(this.dataBaseDir, 'obs-plugins');
  }

  private get appData() {
    return electron.remote.app.getPath('appData');
  }

  private get pluginsBaseDir() {
    return path.join(this.appData, 'slobs-plugins');
  }

  private get obsPluginsDir() {
    return path.join(this.pluginsBaseDir, 'obs-plugins');
  }

  private get dataBaseDir() {
    return path.join(this.pluginsBaseDir, 'data');
  }

  private async ensureDirectory(dirPath: string) {
    return new Promise((resolve, reject) => {
      fs.exists(dirPath, exists => {
        if (exists) {
          resolve();
        } else {
          fs.mkdir(dirPath, err => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }
}
