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
import Blank from '../components/windows/Blank.vue';
import { mutation, StatefulService } from './stateful-service';
import electron from 'electron';

const { ipcRenderer, remote } = electron;



export interface IWindowOptions {
  componentName: string;
  queryParams?: Dictionary<string>;
  size?: {
    width: number;
    height: number;
  };
}

interface IWindowsState {
  main: IWindowOptions;
  child: IWindowOptions;
}

export class WindowsService extends StatefulService<IWindowsState> {

  static initialState: IWindowsState = {
    main: {
      componentName: 'Main',
    },
    child: {
      componentName: 'Blank'
    }
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
    AddSourceFilter,
    Blank
  };

  // inPlace will replace the contents of the current window
  // with the new window.  This is faster since it doesn't
  // re-load and initialize all the assets. Most windowOptions
  // will be ignored.
  showWindow(options: IWindowOptions) {
    ipcRenderer.send('window-showChildWindow', options);
  }

  closeChildWindow() {
    ipcRenderer.send('window-closeChildWindow');

    // This prevents you from seeing the previous contents
    // of the window for a split second after it is shown.
    this.setChildWindowOptions({ componentName: 'Blank' });

    // Refocus the main window
    ipcRenderer.send('window-focusMain');
  }

  closeMainWindow() {
    remote.getCurrentWindow().close();
  }


  getChildWindowOptions(): IWindowOptions {
    return this.state.child;
  }

  getChildWindowQueryParams(): Dictionary<string> {
    return this.getChildWindowOptions().queryParams || {};
  }


  setChildWindowOptions(options: IWindowOptions) {
    this.SET_CHILD_WINDOW_OPTIONS(options);
  }


  @mutation()
  private SET_CHILD_WINDOW_OPTIONS(options: IWindowOptions) {
    this.state.child = options;
  }
}
