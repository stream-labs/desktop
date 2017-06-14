import Vue from 'vue';
import Vuex from 'vuex';
import _ from 'lodash';

// Modules
import navigation from './modules/navigation';
import windowOptions from './modules/windowOptions';

// Stateful Services
import { ScenesService } from '../services/scenes';
import ScenesTransitions from  '../services/scenes-transitions.ts';
import { SourcesService } from '../services/sources.ts';
import SourceFiltersService from '../services/source-filters';
import { SettingsService } from '../services/settings';
import StreamingService from '../services/streaming';
import PerformanceService from '../services/performance';
import { AudioService } from '../services/audio.ts';
import { CustomizationService } from '../services/customization.ts';

const statefulServiceModules = {
  ...ScenesService.getModule(),
  ...ScenesTransitions.getModule(),
  ...SourcesService.getModule(),
  ...SourceFiltersService.getModule(),
  ...SettingsService.getModule(),
  ...StreamingService.getModule(),
  ...PerformanceService.getModule(),
  ...AudioService.getModule(),
  ...CustomizationService.getModule()
};


Vue.use(Vuex);

const { ipcRenderer, remote } = window.require('electron');

const debug = remote.process.env.NODE_ENV !== 'production';

const mutations = {
  BULK_LOAD_STATE(state, data) {
    _.each(data.state, (value, key) => {
      state[key] = value;
    });
  },

  // Used by PersistentStatefulService
  LOAD_PERSISTED_STATE(state, data) {
    state[data.serviceName] = data.state;
  }
};

const actions = {
};

const plugins = [];

// This plugin will keep all vuex stores in sync via
// IPC with the main process.
plugins.push(store => {
  store.subscribe(mutation => {
    if (mutation.payload && !mutation.payload.__vuexSyncIgnore) {
      ipcRenderer.send('vuex-mutation', {
        type: mutation.type,
        payload: mutation.payload
      });
    }
  });

  // Only the main window should ever receive this
  ipcRenderer.on('vuex-sendState', (event, windowId) => {
    let win = remote.BrowserWindow.fromId(windowId);
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
    navigation,
    windowOptions,
    ...statefulServiceModules
  },
  plugins,
  mutations,
  actions,
  strict: debug
});
