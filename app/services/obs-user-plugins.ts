import { Service } from './core/service';
import fs from 'fs';
import path from 'path';
import electron from 'electron';
import * as obs from '../../obs-api';
import Utils from './utils';

// WARNING: This service is initialized extremely early
// and should not import any other services.

export class ObsUserPluginsService extends Service {
  async initialize() {
    // Make a best effort but don't stop SLOBS from loading
    try {
      Utils.measure('Ensure plugins start');
      await Promise.all([
        this.ensureDirectory(this.pluginsBaseDir),
        this.ensureDirectory(this.obsPluginsDir),
        this.ensureDirectory(this.pluginsDir),
        this.ensureDirectory(this.dataBaseDir),
        this.ensureDirectory(this.dataDir),
      ]);
      Utils.measure('Ensure plugins finish');
    } catch (e) {
      console.error('Error creating plugin directories', ...e);
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
