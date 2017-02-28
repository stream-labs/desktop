import Vue from 'vue';
import Vuex from 'vuex';
import navigation from './modules/navigation.js';
import scenes from './modules/scenes.js';
import sources from './modules/sources.js';
import streaming from './modules/streaming.js';
import _ from 'lodash';

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

  // Create a bunch of test scenes and sources
  initTestData({ dispatch }) {
    dispatch({
      type: 'createNewScene',
      sceneName: 'Example Scene 1'
    });
    dispatch({
      type: 'createNewScene',
      sceneName: 'Example Scene 2'
    });
    dispatch({
      type: 'createNewScene',
      sceneName: 'Example Scene 3'
    });

    dispatch({
      type: 'makeSceneActive',
      sceneName: 'Example Scene 1'
    });

    dispatch({
      type: 'createSourceAndAddToScene',
      sceneName: 'Example Scene 1',
      sourceType: 'Video Capture Device',
      sourceName: 'Video Capture 1',
      sourceId: ipcRenderer.sendSync('getUniqueId')
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
    win.webContents.send('vuex-loadState', store.state);
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
    streaming
  },
  plugins,
  mutations,
  actions,
  strict: debug
});
