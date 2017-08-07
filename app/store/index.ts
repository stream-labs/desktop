import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import _ from 'lodash';
import electron from '../vendor/electron';

// Stateful Services and Classes
import { getModule } from '../services/stateful-service';
import { WindowService } from '../services/window';
import { ServicesManager, IMutation } from '../services-manager';


const statefulServiceModules = {};
const servicesManager: ServicesManager = ServicesManager.instance;
const statefulServices = servicesManager.getStatefulServices();
Object.keys(statefulServices).forEach(serviceName => {
  statefulServiceModules[serviceName] = getModule(statefulServices[serviceName]);
});


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

      const mutationToSend: IMutation = {
        type: mutation.type,
        payload: mutation.payload
      };

      if (servicesManager.isMutationBufferingEnabled()) {
        servicesManager.addMutationToBuffer(mutationToSend);
      } else {
        ipcRenderer.send('vuex-mutation', mutationToSend);
      }
    }
  });

  // Only the main window should ever receive this
  ipcRenderer.on('vuex-sendState', (event, windowId) => {
    const win = remote.BrowserWindow.fromId(windowId);
    win.webContents.send('vuex-loadState', _.omit(store.state, ['WindowService']));
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
    commitMutation(mutation);
  });

  ipcRenderer.send('vuex-register');
});


export const store = new Vuex.Store({
  modules: {
    ...statefulServiceModules
  },
  plugins,
  mutations,
  actions,
  strict: debug
});


export function commitMutation(mutation: IMutation) {
  store.commit(mutation.type, Object.assign({}, mutation.payload, {
    __vuexSyncIgnore: true
  }));
}
