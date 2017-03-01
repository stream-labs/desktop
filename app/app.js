window.eval = global.eval = function() {
  throw new Error("window.eval() is disabled for security");
}

import Vue from 'vue';
import store from './store';
import Obs from './api/Obs.js';
import windowManager from './util/WindowManager.js';
import URI from 'urijs';
import contextMenuManager from './util/ContextMenuManager.js';
import _ from 'lodash';
const { ipcRenderer } = window.require('electron');

require('./app.less');

document.addEventListener('DOMContentLoaded', function() {
  let query = URI.parseQuery(URI.parse(window.location.href).query);
  let isChild = query.child;

  if (isChild) {
    store.dispatch({ type: 'setWindowAsChild' });
    store.dispatch({
      type: 'setWindowOptions',
      options: _.omit(query, ['child'])
    });
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

    // This is purely for developer convencience.  Changing the URL
    // to match the current contents, as well as pulling the options
    // from the URL allows child windows to be refreshed without
    // losing their contents.
    let newOptions = Object.assign({ child: isChild }, options);
    let newURL = URI(window.location.href).query(newOptions).toString()

    window.history.replaceState({}, '', newURL);
  });
});
