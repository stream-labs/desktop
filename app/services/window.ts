// This singleton class provides a renderer-space API
// for spawning various child windows.

import Main from '../components/windows/Main.vue';
import Settings from '../components/windows/Settings.vue';
import AddSource from '../components/windows/AddSource.vue';
import SceneTransitions from '../components/windows/SceneTransitions.vue';
import AddSceneTransition from '../components/windows/AddSceneTransition.vue';
import SceneTransitionProperties from '../components/windows/SceneTransitionProperties.vue';
import NameSource from '../components/windows/NameSource.vue';
import NameScene from '../components/windows/NameScene.vue';
import SourceProperties from '../components/windows/SourceProperties.vue';
import SourceFilters from '../components/windows/SourceFilters.vue';
import AddSourceFilter from '../components/windows/AddSourceFilter.vue';
import { Service } from './service';
import store from '../store';
import electron from '../vendor/electron';
import { TSourceType } from './sources';

const { ipcRenderer, remote } = electron;

export interface IWindowOptions {
  startupOptions: {
    component: string
    [key: string]: string
  };
  windowOptions: {
    width: number,
    height: number
  };
}

export class WindowService extends Service {

  // This is a list of components that are registered to be
  // top level components in new child windows.
  components = {
    Main,
    Settings,
    SceneTransitions,
    AddSceneTransition,
    SceneTransitionProperties,
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
    if (store.state.windowOptions.isChild) {
      remote.getCurrentWindow().hide();

      // This prevents you from seeing the previous contents
      // of the window for a split second after it is shown.
      store.dispatch({
        type: 'setWindowOptions',
        options: {}
      });
    } else {
      remote.getCurrentWindow().close();
    }
  }

  getOptions() {
    return store.state.windowOptions.options;
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
        height: 400
      }
    });
  }

  showAddSceneTransition() {
    this.showWindow({
      startupOptions: {
        component: 'AddSceneTransition'
      },
      windowOptions: {
        width: 800,
        height: 600
      }
    });
  }

  showSceneTransitionProperties(transitionName = '') {
    this.showWindow({
      startupOptions: {
        component: 'SceneTransitionProperties',
        transitionName
      },
      windowOptions: {
        width: 800,
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


}
