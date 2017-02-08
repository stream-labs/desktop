// This singleton class provides a renderer-space API
// for spawning various child windows.

const { ipcRenderer } = window.require('electron');

import Settings from '../components/Settings.vue';
import AddSource from '../components/AddSource.vue';

class WindowManager {

  constructor() {
    // This is a list of components that are registered to be
    // top level components in new child windows.
    this.components = {
      Settings,
      AddSource
    };
  }

  // These methods are basically presets for showing
  // various dialog windows.

  showSettings() {
    ipcRenderer.send('window-spawnChildWindow', {
      component: 'Settings',
      options: {
        frame: false
      }
    });
  }

  showAddSource() {
    ipcRenderer.send('window-spawnChildWindow', {
      component: 'AddSource',
      options: {
        frame: false
      }
    });
  }

}

export default new WindowManager();
