import Vue from 'vue';
import Vuex from 'vuex';
import navigation from './modules/navigation.js';
import scenes from './modules/scenes.js';
import _ from 'lodash';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

const { ipcRenderer, remote } = window.require('electron');

const mutations = {
  BULK_LOAD_STATE(state, newState) {
    _.each(newState, (value, key) => {
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
    })

    dispatch({
      type: 'addSourceToScene',
      sceneName: 'Example Scene 1',
      sourceType: 'Video Capture Device',
      sourceName: 'Video Capture 1',
      settings: {},
      hotkeyData: {}
    });
  }
};


export default isMaster => {
  const store = new Vuex.Store({
    modules: {
      navigation,
      scenes
    },
    mutations,
    actions,
    strict: debug
  });

  // The following code handles syncing vuex stores
  // in other windows with the main window.

  // The main window owns the "master" store
  if (isMaster) {
    // These are stored as window ids
    let registeredStores = [];

    ipcRenderer.on('vuex-register', (event, windowId) => {
      console.log("GOT REGISTER");

      registeredStores.push(windowId);

      let win = remote.BrowserWindow.fromId(windowId);

      win.webContents.send('vuex-load', store.state);
    });

    store.subscribe(mutation => {
      _.each(registeredStores, windowId => {
        let win = remote.BrowserWindow.fromId(windowId);
        win.webContents.send('vuex-mutation', Object.assign({}, mutation.payload, {
          type: mutation.type
        }));
      });
    });

    ipcRenderer.on('vuex-mutation', (event, args) => {
      store.commit(args);
    });
  } else {
    const _commit = store.commit;
    const mainWindowId = ipcRenderer.sendSync('getMainWindowId');
    const mainWindow = remote.BrowserWindow.fromId(mainWindowId);

    store.commit = function() {
      // Always send object style commits
      let commit = arguments[0];

      if (arguments[1]) {
        commit = Object.assign({}, arguments[1], {
          type: arguments[0]
        });
      }

      mainWindow.webContents.send('vuex-mutation', commit);
    };

    ipcRenderer.on('vuex-load', (event, state) => {
      console.log("GOT BULK LOAD");
      _commit('BULK_LOAD_STATE', state);
    });

    ipcRenderer.on('vuex-mutation', (event, mutation) => {
      _commit(mutation);
    });

    mainWindow.webContents.send('vuex-register', remote.getCurrentWindow().id);
  }

  return store;
}
