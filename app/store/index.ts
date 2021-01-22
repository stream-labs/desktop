import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import each from 'lodash/each';
import electron from 'electron';
import { getModule, mutation, StatefulService } from '../services/core/stateful-service';
import { ServicesManager } from '../services-manager';
import { IMutation } from 'services/api/jsonrpc';
import Util from 'services/utils';
import { InternalApiService } from 'services/api/internal-api';
import cloneDeep from 'lodash/cloneDeep';
import { Subject } from 'rxjs';

Vue.use(Vuex);

const { ipcRenderer, remote } = electron;

const mutations = {
  // tslint:disable-next-line:function-name
  BULK_LOAD_STATE(state: any, data: any) {
    each(data.state, (value, key) => {
      if (key === 'i18nReady') return;
      state[key] = value;
    });
  },

  I18N_READY(state: any) {
    state.i18nReady = true;
  },
};

const actions = {};

const plugins: any[] = [];

let mutationId = 0;
const isWorkerWindow = Util.isWorkerWindow();
let storeCanReceiveMutations = isWorkerWindow;

/**
 * A global cache of the last N mutations that have been
 * executed. This is used to catch up renderers that make
 * synchronous calls and are behind on mutations.
 */
const globalMutationCache: IMutation[] = [];
const MUTATION_CACHE_SIZE = 100;

// This plugin will keep all vuex stores in sync via IPC
plugins.push((store: Store<any>) => {
  store.subscribe((mutation: Dictionary<any>) => {
    const internalApiService: InternalApiService = InternalApiService.instance;
    if (mutation.payload && !mutation.payload.__vuexSyncIgnore) {
      if (!isWorkerWindow) {
        throw new Error('Mutation originated from non-worker window!');
      }

      const mutationToSend: IMutation = {
        id: ++mutationId,
        type: mutation.type,
        payload: mutation.payload,
      };

      globalMutationCache[mutationToSend.id % MUTATION_CACHE_SIZE] = mutationToSend;
      internalApiService.handleMutation(mutationToSend);
      sendMutationToRendererWindows(mutationToSend);
    }
  });

  // Only the worker window should ever receive this
  ipcRenderer.on('vuex-sendState', (event: Electron.Event, windowId: number) => {
    const win = remote.BrowserWindow.fromId(windowId);
    flushMutations();
    win.webContents.send('vuex-loadState', {
      mutationId,
      state: JSON.stringify(store.state),
    });
  });

  // Only renderer windows should ever receive this
  ipcRenderer.on(
    'vuex-loadState',
    (event: Electron.Event, msg: { mutationId: number; state: any }) => {
      mutationId = msg.mutationId;

      store.commit('BULK_LOAD_STATE', {
        state: JSON.parse(msg.state),
        __vuexSyncIgnore: true,
      });

      // renderer windows can't receive mutations until after the BULK_LOAD_STATE event
      storeCanReceiveMutations = true;
    },
  );

  // All windows can receive this
  ipcRenderer.on('vuex-mutation', (event: Electron.Event, mutationString: string) => {
    if (!storeCanReceiveMutations) return;

    const mutations = JSON.parse(mutationString);
    for (const mutation of mutations) {
      commitMutation(mutation);
    }
  });

  ipcRenderer.send('vuex-register');
});

let store: Store<any> = null;

export function createStore(): Store<any> {
  const statefulServiceModules = {};
  const servicesManager: ServicesManager = ServicesManager.instance;

  // TODO: This is bad and I should feel bad
  window['servicesManager'] = servicesManager;

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
      bulkLoadFinished: !!Util.isWorkerWindow(),
      i18nReady: false,
    },
  });

  StatefulService.setupVuexStore(store);

  return store;
}

const mutationCommitted = new Subject<number>();

export function commitMutation(mutation: IMutation) {
  if (mutation.id > mutationId + 1) {
    console.error('Received out of order mutation', `${mutationId} -> ${mutation.id}`);
  } else if (mutation.id <= mutationId) {
    console.debug(`Skipping outdated mutation ${mutation.id}`);
    return;
  }

  mutationId = mutation.id;

  store.commit(
    mutation.type,
    Object.assign({}, mutation.payload, {
      __vuexSyncIgnore: true,
    }),
  );

  mutationCommitted.next(mutation.id);
}

export function getMutationId() {
  return mutationId;
}

/**
 * Returns all of the mutations after `id` up to the latest current
 * mutation in this context, pulled from the mutation cache. This
 * is used to catch up renderers making synchronous requests that
 * may be behind on mutations.
 * @param id The id of the mutations to fetch from
 */
export function getMutationsSince(id: number): IMutation[] {
  const mutations = [];

  for (let i = id + 1; i <= mutationId; i++) {
    const mutation = globalMutationCache[i % MUTATION_CACHE_SIZE];

    // Double check we got a cache hit
    if (mutation.id !== i) {
      console.error(`Failed fetching mutation ${i} from global cache. Cache may be too small`);
    } else {
      mutations.push(mutation);
    }
  }

  return mutations;
}

/**
 * Returns a promise that resolves when the given mutation id
 * has been commited;
 * @param id The mutation id to wait for
 */
export function waitForMutationId(id: number) {
  if (mutationId >= id) return Promise.resolve();

  return new Promise(resolve => {
    const sub = mutationCommitted.subscribe(committedId => {
      if (committedId >= id) {
        sub.unsubscribe();
        resolve();
      }
    });
  });
}

const mutationsQueue: IMutation[] = [];

/**
 * Add mutation to the queue so we can send it to the renderer windows along with other
 * pending mutations.
 * This prevents multiple re-renders of Vue components for each single mutation.
 */
function sendMutationToRendererWindows(mutation: IMutation) {
  // we need to `cloneDeep` to avoid sending modified data from the state
  mutationsQueue.push(cloneDeep(mutation));
  setTimeout(() => flushMutations());
}

function flushMutations() {
  ipcRenderer.send('vuex-mutation', JSON.stringify(mutationsQueue));
  mutationsQueue.length = 0;
}
