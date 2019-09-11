import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import each from 'lodash/each';
import electron from 'electron';
import { getModule, StatefulService } from '../services/core/stateful-service';
import { ServicesManager } from '../services-manager';
import { IMutation } from 'services/api/jsonrpc';
import Util from 'services/utils';
import { InternalApiService } from 'services/api/internal-api';

Vue.use(Vuex);

const { ipcRenderer, remote } = electron;

const debug = process.env.NODE_ENV !== 'production';

const mutations = {
  // tslint:disable-next-line:function-name
  BULK_LOAD_STATE(state: any, data: any) {
    each(data.state, (value, key) => {
      state[key] = value;
      state.bulkLoadFinished = true;
    });
  },
};

const actions = {};

const plugins: any[] = [];

let mutationId = 1;
const isWorkerWindow = Util.isWorkerWindow();
let storeCanReceiveMutations = isWorkerWindow;

// This plugin will keep all vuex stores in sync via IPC
plugins.push((store: Store<any>) => {
  store.subscribe((mutation: Dictionary<any>) => {
    const internalApiService: InternalApiService = InternalApiService.instance;
    if (mutation.payload && !mutation.payload.__vuexSyncIgnore) {
      const mutationToSend: IMutation = {
        id: mutationId++,
        type: mutation.type,
        payload: mutation.payload,
      };
      internalApiService.handleMutation(mutationToSend);
      ipcRenderer.send('vuex-mutation', JSON.stringify(mutationToSend));
    }
  });

  // Only the worker window should ever receive this
  ipcRenderer.on('vuex-sendState', (event: Electron.Event, windowId: number) => {
    const win = remote.BrowserWindow.fromId(windowId);
    win.webContents.send('vuex-loadState', JSON.stringify(store.state));
  });

  // Only renderer windows should ever receive this
  ipcRenderer.on('vuex-loadState', (event: Electron.Event, state: any) => {
    store.commit('BULK_LOAD_STATE', {
      state: JSON.parse(state),
      __vuexSyncIgnore: true,
    });

    // renderer windows can't receive mutations until after the BULK_LOAD_STATE event
    storeCanReceiveMutations = true;
  });

  // All windows can receive this
  ipcRenderer.on('vuex-mutation', (event: Electron.Event, mutationString: string) => {
    if (!storeCanReceiveMutations) return;

    const mutation = JSON.parse(mutationString);

    // for worker window commit mutation directly
    if (isWorkerWindow) {
      commitMutation(mutation);
      return;
    }

    // for renderer windows commit mutations via api-client
    const servicesManager: ServicesManager = ServicesManager.instance;
    servicesManager.internalApiClient.handleMutation(mutation);
  });

  ipcRenderer.send('vuex-register');
});

let store: Store<any> = null;

export function createStore(): Store<any> {
  const statefulServiceModules = {};
  const servicesManager: ServicesManager = ServicesManager.instance;
  const statefulServices = servicesManager.getStatefulServicesAndMutators();
  Object.keys(statefulServices).forEach(serviceName => {
    statefulServiceModules[serviceName] = getModule(statefulServices[serviceName]);
  });

  store = new Vuex.Store({
    plugins,
    mutations,
    actions,
    modules: {
      ...statefulServiceModules,
    },
    strict: false,
    state: {
      bulkLoadFinished: Util.isWorkerWindow() ? true : false,
    },
  });

  StatefulService.setupVuexStore(store);

  return store;
}

export function commitMutation(mutation: IMutation) {
  store.commit(
    mutation.type,
    Object.assign({}, mutation.payload, {
      __vuexSyncIgnore: true,
    }),
  );
}
