// This singleton class provides a renderer-space API
// for spawning various child windows.

const { ipcRenderer, remote } = window.require('electron');

import Main from '../components/windows/Main.vue';
import Settings from '../components/windows/Settings.vue';
import AddSource from '../components/windows/AddSource.vue';
import NameSource from '../components/windows/NameSource.vue';
import NameScene from '../components/windows/NameScene.vue';
import SourceProperties from '../components/windows/SourceProperties.vue';
import store from '../store';
import configFileManager from'../util/ConfigFileManager.js';

class WindowManager {

  constructor() {
    // This is a list of components that are registered to be
    // top level components in new child windows.
    this.components = {
      Main,
      Settings,
      AddSource,
      NameSource,
      NameScene,
      SourceProperties
    };
  }

  // inPlace will replace the contents of the current window
  // with the new window.  This is faster since it doesn't
  // re-load and initialize all the assets. Most windowOptions
  // will be ignored.
  showWindow(data) {
    ipcRenderer.send('window-showChildWindow', data);
  }

  // Will close the current window.
  // If this is the child window, it will be hidden instead.
  closeWindow(data) {
    if (store.state.windowOptions.isChild) {
      remote.getCurrentWindow().hide();

      // This prevents you from seeing the previous contents
      // of the window for a split second after it is shown.
      store.dispatch({
        type: 'setWindowOptions',
        options: {}
      });
    } else {
      configFileManager.save();

      remote.getCurrentWindow().close();
    }
  }

  // These methods are basically presets for showing
  // various dialog windows.

  showSettings() {
    this.showWindow({
      startupOptions: {
        component: 'Settings'
      },
      windowOptions: {
        width: 800,
        height: 600
      }
    });
  }

  showAddSource() {
    this.showWindow({
      startupOptions: {
        component: 'AddSource'
      },
      windowOptions: {
        width: 800,
        height: 600
      }
    });
  }

  showNameSource(sourceType) {
    this.showWindow({
      startupOptions: {
        component: 'NameSource',
        sourceType
      },
      windowOptions: {
        width: 400,
        height: 240
      }
    });
  }

  showNameScene() {
    this.showWindow({
      startupOptions: {
        component: 'NameScene'
      },
      windowOptions: {
        width: 400,
        height: 240
      }
    });
  }

  showSourceProperties(sourceId) {
    this.showWindow({
      startupOptions: {
        component: 'SourceProperties',
        sourceId
      },
      windowOptions: {
        width: 600,
        height: 800
      }
    });

  }


}

export default new WindowManager();
