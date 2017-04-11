import Vue from 'vue';
import Vuex from 'vuex';
import navigation from './modules/navigation.js';
import scenes from './modules/scenes.js';
import sources from './modules/sources.js';
import streaming from './modules/streaming.js';
import windowOptions from './modules/windowOptions.js';
import video from './modules/video.js';
import _ from 'lodash';
import Obs from '../api/Obs.js';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

const { ipcRenderer, remote } = window.require('electron');

const mutations = {
  BULK_LOAD_STATE(state, data) {
    _.each(data.state, (value, key) => {
      state[key] = value;
    });
  }
};

const actions = {
  loadConfiguration({ commit }, data) {
    commit('RESET_SCENES');
    commit('RESET_SOURCES');

    const scenes = Obs.getScenes();

    _.each(scenes, scene => {
      commit('ADD_SCENE', {
        name: scene
      });

      const sources = Obs.getSourcesInScene(scene);

      _.each(sources, source => {
        const id = ipcRenderer.sendSync('getUniqueId');
        const properties = Obs.sourceProperties(source, id);

        commit('ADD_SOURCE', {
          id,
          name: source,
          type: null,
          properties
        });

        commit('ADD_SOURCE_TO_SCENE', {
          sceneName: scene,
          sourceId: id
        });
      });
    });
  }
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
      state: state,
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
    scenes,
    sources,
    streaming,
    windowOptions,
    video
  },
  plugins,
  mutations,
  actions,
  strict: debug
});
