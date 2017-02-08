// This singleton class provides a renderer-space API
// for spawning various child windows.

const { ipcRenderer } = window.require('electron');

import Main from '../components/windows/Main.vue';
import Settings from '../components/windows/Settings.vue';
import AddSource from '../components/windows/AddSource.vue';

class WindowManager {

  constructor() {
    // This is a list of components that are registered to be
    // top level components in new child windows.
    this.components = {
      Main,
      Settings,
      AddSource
    };
  }

  // These methods are basically presets for showing
  // various dialog windows.

  showSettings() {
    ipcRenderer.send('window-spawnChildWindow', {
      startupOptions: {
        component: 'Settings'
      },
      options: {
        frame: false
      }
    });
  }

  showAddSource() {
    ipcRenderer.send('window-spawnChildWindow', {
      startupOptions: {
        component: 'AddSource'
      },
      options: {
        frame: false
      }
    });
  }

}

export default new WindowManager();
