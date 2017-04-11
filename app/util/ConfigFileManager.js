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
  }

  load() {
    Obs.loadConfig(this.path);
    store.dispatch('loadConfiguration');
  }

  save() {
    Obs.saveConfig(this.path);
  }

}

export default new ConfigFileManager();
