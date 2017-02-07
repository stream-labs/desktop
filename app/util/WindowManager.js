// This singleton class handles spawning of child windows.
// It will make sure there is only 1 child window open at
// a time, and make sure it is parented to the main window.

const remote = window.require('electron').remote;

import Settings from '../components/Settings.vue';
import Vue from 'vue';

class WindowManager {

  constructor() {
    this.childWindow = null;

    // This is a list of components that are registered to be
    // top level components in new child windows.
    this.components = {
      Settings
    };
  }

  showChildWindow(componentName, options) {
    // Only the main window can show child windows.
    if (!window.MAIN_WINDOW) {
      throw new Error('Only the main window can show child windows!');
    }

    // Only show 1 window at a time
    if (!this.childWindow) {
      const opts = Object.assign({}, options, {
        parent: remote.getCurrentWindow()
      });

      this.childWindow = new remote.BrowserWindow(opts);
      this.childWindow.webContents.openDevTools();

      this.childWindow.loadURL(
        remote.getGlobal('pageUrl') + '?component=' + componentName
      );
    }
  }

}

export default new WindowManager();
