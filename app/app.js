window.eval = global.eval = function() {
  throw new Error("window.eval() is disabled for security");
}

import Vue from 'vue';
import store from './store';
import Obs from './api/Obs.js';
import windowManager from './util/WindowManager.js';
import URI from 'urijs';
import contextMenuManager from './util/ContextMenuManager.js';
const { ipcRenderer } = window.require('electron');

require('./app.less');

document.addEventListener('DOMContentLoaded', function() {
  let isChild = URI.parseQuery(URI.parse(window.location.href).query).child;

  if (isChild) {
    store.dispatch({ type: 'setWindowAsChild' });
  } else {
    store.dispatch({
      type: 'setWindowOptions',
      options: {
        component: 'Main'
      }
    });
  }

  window.obs = Obs.nodeObs;

  let vm = new Vue({
    el: '#app',
    store: store,
    render: h => {
      let componentName = store.state.windowOptions.options.component;

      return h(windowManager.components[componentName]);
    }
  });

  // Initialize the custom context menu system
  contextMenuManager.init();

  // Used for replacing the contents of this window with
  // a new top level component
  ipcRenderer.on('window-setContents', (event, options) => {
    store.dispatch({
      type: 'setWindowOptions',
      options
    });
  });
});
