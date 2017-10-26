// Singleton for loading and saving from a config file.
// Currently only a single config file is supported.

import _ from 'lodash';
import Obs from '../api/Obs';
import { ScenesService } from '../services/scenes';

class ConfigFileManager {

  constructor() {
    // Calling save is expensive, so only call it at most
    // every 5 seconds.
    this.save = _.throttle(this.rawSave, 5000);
  }

  load() {
    Obs.loadConfig();
    ScenesService.instance.loadSceneConfig();
  }

  rawSave() {
    Obs.saveConfig();
  }

}

export default new ConfigFileManager();
