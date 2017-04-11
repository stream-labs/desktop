// Singleton for loading and saving from a config file.
// Currently only a single config file is supported.

import Obs from '../api/Obs.js';
import store from '../store';

const { remote } = window.require('electron');
const path = window.require('path');

class ConfigFileManager {

  constructor() {
    this.filename = 'config.json';
    this.path = path.join(remote.app.getPath('userData'), this.filename);

    // Calling save is expensive, so only call it at most
    // every 5 seconds.
    this.save = _.throttle(this.rawSave, 5000);
  }

  load() {
    Obs.loadConfig(this.path);
    store.dispatch('loadConfiguration');
  }

  rawSave() {
    Obs.saveConfig(this.path);
  }

}

export default new ConfigFileManager();
