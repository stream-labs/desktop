// This singleton class provides a renderer-space API
// for spawning various child windows.

import Main from '../components/windows/Main.vue';
import Settings from '../components/windows/Settings.vue';
import AddSource from '../components/windows/AddSource.vue';
import SceneTransitions from '../components/windows/SceneTransitions.vue';
import NameSource from '../components/windows/NameSource.vue';
import NameScene from '../components/windows/NameScene.vue';
import SourceProperties from '../components/windows/SourceProperties.vue';
import SourceFilters from '../components/windows/SourceFilters.vue';
import AddSourceFilter from '../components/windows/AddSourceFilter.vue';
import { mutation, StatefulService } from './stateful-service';
import electron from 'electron';
import { TSourceType } from './sources';
import { WidgetType } from './widgets';

const { ipcRenderer, remote } = electron;

interface IWindowStartupOptions {
  component?: string;
  [key: string]: string | number;
}

export interface IWindowOptions {
  startupOptions: IWindowStartupOptions;
  windowOptions: {
    width: number,
    height: number
  };
}

interface IWindowState {
  options: IWindowStartupOptions;
  isChild: boolean;
}


export class WindowService extends StatefulService<IWindowState> {

  static initialState: IWindowState = {
    options: {},
    isChild: false
  };

  // This is a list of components that are registered to be
  // top level components in new child windows.
  components = {
    Main,
    Settings,
    SceneTransitions,
    AddSource,
    NameSource,
    NameScene,
    SourceProperties,
    SourceFilters,
    AddSourceFilter
  };

  // inPlace will replace the contents of the current window
  // with the new window.  This is faster since it doesn't
  // re-load and initialize all the assets. Most windowOptions
  // will be ignored.
  showWindow(options: IWindowOptions) {
    ipcRenderer.send('window-showChildWindow', options);
  }

  // Will close the current window.
  // If this is the child window, it will be hidden instead.
  closeWindow() {
    if (this.state.isChild) {
      remote.getCurrentWindow().hide();

      // This prevents you from seeing the previous contents
      // of the window for a split second after it is shown.
      this.setWindowOptions({});

      // Refocus the main window
      ipcRenderer.send('window-focusMain');
    } else {
      remote.getCurrentWindow().close();
    }
  }


  getOptions() {
    return this.state.options;
  }


  setWindowOptions(options: IWindowStartupOptions) {
    this.SET_WINDOW_OPTIONS(options);
  }


  setWindowAsChild() {
    this.SET_WINDOW_AS_CHILD();
  }

  // These methods are basically presets for showing
  // various dialog windows.

  showSceneTransitions() {
    this.showWindow({
      startupOptions: {
        component: 'SceneTransitions'
      },
      windowOptions: {
        width: 500,
        height: 600
      }
    });
  }

  showSettings() {
    this.showWindow({
      startupOptions: {
        component: 'Settings'
      },
      windowOptions: {
        width: 800,
        height: 800
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
        height: 520
      }
    });
  }

  showNameSource(sourceType: TSourceType) {
    this.showWindow({
      startupOptions: {
        component: 'NameSource',
        sourceType
      },
      windowOptions: {
        width: 400,
        height: 250
      }
    });
  }

  showNameWidget(widgetType: WidgetType) {
    this.showWindow({
      startupOptions: {
        component: 'NameSource',
        widgetType
      },
      windowOptions: {
        width: 400,
        height: 250
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
        height: 250
      }
    });
  }

  showDuplicateScene(sceneName: string) {
    this.showWindow({
      startupOptions: {
        component: 'NameScene',
        sceneToDuplicate: sceneName
      },
      windowOptions: {
        width: 400,
        height: 250
      }
    });
  }

  showSourceProperties(sourceId: string) {
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

  showSourceFilters(sourceName = '', selectedFilterName = '') {
    this.showWindow({
      startupOptions: {
        component: 'SourceFilters',
        sourceName,
        selectedFilterName
      },
      windowOptions: {
        width: 800,
        height: 800
      }
    });
  }

  showAddSourceFilter(sourceName = '') {
    this.showWindow({
      startupOptions: {
        component: 'AddSourceFilter',
        sourceName
      },
      windowOptions: {
        width: 600,
        height: 400
      }
    });
  }

  // This module handles windowOptions.  This is the only
  // piece of the vuex store that is not synchronized
  // between various windows.  These are unique to the
  // current window, and tell the window what it should
  // be displaying currently.


  @mutation({ vuexSyncIgnore: true })
  SET_WINDOW_OPTIONS(options: IWindowStartupOptions) {
    this.state.options = options;
  }


  @mutation({ vuexSyncIgnore: true })
  SET_WINDOW_AS_CHILD() {
    this.state.isChild = true;
  }

}
