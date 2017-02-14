// This singleton class provides a renderer-space API
// for spawning various child windows.

const { ipcRenderer, remote } = window.require('electron');

import Main from '../components/windows/Main.vue';
import Settings from '../components/windows/Settings.vue';
import AddSource from '../components/windows/AddSource.vue';
import NameSource from '../components/windows/NameSource.vue';
import SourceProperties from '../components/windows/SourceProperties.vue';

class WindowManager {

  constructor() {
    // This is a list of components that are registered to be
    // top level components in new child windows.
    this.components = {
      Main,
      Settings,
      AddSource,
      NameSource,
      SourceProperties
    };
  }

  // inPlace will replace the contents of the current window
  // with the new window.  This is faster since it doesn't
  // re-load and initialize all the assets. Most windowOptions
  // will be ignored.
  showWindow(data) {
    if (data.inPlace) {
      window.startupOptions = data.startupOptions;
      window.reset();

      if (data.windowOptions.width && data.windowOptions.height) {
        const win = remote.getCurrentWindow();

        win.setSize(data.windowOptions.width, data.windowOptions.height);
      }

    } else {
      ipcRenderer.send('window-spawnChildWindow', data);
    }
  }

  // Will close the current window
  closeWindow() {
    remote.getCurrentWindow().close();
  }

  // These methods are basically presets for showing
  // various dialog windows.

  showSettings(inPlace = false) {
    this.showWindow({
      startupOptions: {
        component: 'Settings'
      },
      windowOptions: {
        frame: false
      },
      inPlace
    });
  }

  showAddSource(inPlace = false) {
    this.showWindow({
      startupOptions: {
        component: 'AddSource'
      },
      windowOptions: {
        frame: false
      },
      inPlace
    });
  }

  showNameSource(inPlace = false, sourceType) {
    this.showWindow({
      startupOptions: {
        component: 'NameSource',
        sourceType
      },
      windowOptions: {
        frame: false,
        width: 400,
        height: 240
      },
      inPlace
    });
  }

  showSourceProperties(inPlace = false, sourceName) {
    this.showWindow({
      startupOptions: {
        component: 'SourceProperties',
        sourceName
      },
      windowOptions: {
        // Eventually souceType will determine window size
        frame: false,
        width: 400,
        height: 700
      },
      inPlace
    });
  }

}

export default new WindowManager();
