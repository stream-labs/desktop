import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import _ from 'lodash';
import electron from '../vendor/electron';

// Modules
import navigation from './modules/navigation';
import windowOptions from './modules/windowOptions';

// Stateful Services and Classes
import { getModule } from '../services/stateful-service';
import { ScenesService, Scene, SceneSource } from '../services/scenes';
import ScenesTransitions from  '../services/scenes-transitions.ts';
import { SourcesService, Source } from '../services/sources';
import SourceFiltersService from '../services/source-filters';
import { SettingsService } from '../services/settings';
import StreamingService from '../services/streaming';
import { PerformanceService } from '../services/performance';
import { AudioService, AudioSource } from '../services/audio';
import { CustomizationService } from '../services/customization';
import { UserService } from '../services/user';
import { NavigationService } from '../services/navigation';

const statefulServiceModules = {
  ...getModule(ScenesService),
  ...getModule(Scene),
  ...getModule(SceneSource),
  ...getModule(ScenesTransitions),
  ...getModule(SourcesService),
  ...getModule(Source),
  ...getModule(SourceFiltersService),
  ...getModule(SettingsService),
  ...getModule(StreamingService),
  ...getModule(PerformanceService),
  ...getModule(AudioService),
  ...getModule(AudioSource),
  ...getModule(CustomizationService),
  ...getModule(UserService),
  ...getModule(NavigationService)
};


Vue.use(Vuex);

const { ipcRenderer, remote } = electron;

const debug = remote.process.env.NODE_ENV !== 'production';

const mutations = {
  BULK_LOAD_STATE(state: any, data: any) {
    _.each(data.state, (value, key) => {
      state[key] = value;
    });
  }
};

const actions = {
};

const plugins = [];

// This plugin will keep all vuex stores in sync via
// IPC with the main process.
plugins.push((store: Store<any>) => {
  store.subscribe((mutation: Dictionary<any>) => {
    if (mutation.payload && !mutation.payload.__vuexSyncIgnore) {
      ipcRenderer.send('vuex-mutation', {
        type: mutation.type,
        payload: mutation.payload
      });
    }
  });

  // Only the main window should ever receive this
  ipcRenderer.on('vuex-sendState', (event, windowId) => {
    const win = remote.BrowserWindow.fromId(windowId);
    win.webContents.send('vuex-loadState', _.omit(store.state, ['windowOptions']));
  });

  // Only child windows should ever receive this
  ipcRenderer.on('vuex-loadState', (event, state) => {
    store.commit('BULK_LOAD_STATE', {
      state,
      __vuexSyncIgnore: true
    });
  });

  // All windows can receive this
  ipcRenderer.on('vuex-mutation', (event, mutation) => {
    store.commit(mutation.type, Object.assign({}, mutation.payload, {
      __vuexSyncIgnore: true
    }));
  });

  ipcRenderer.send('vuex-register');
});

export default new Vuex.Store({
  modules: {
    windowOptions,
    ...statefulServiceModules
  },
  plugins,
  mutations,
  actions,
  strict: debug
});
