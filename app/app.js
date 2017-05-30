window.eval = global.eval = function() {
  throw new Error("window.eval() is disabled for security");
}

import Vue from 'vue';
import _ from 'lodash';
import URI from 'urijs';

import store from './store';
import Obs from './api/Obs';
import windowManager from './util/WindowManager';
import contextMenuManager from './util/ContextMenuManager';
import configFileManager from './util/ConfigFileManager';
import PeriodicRunner from './util/PeriodicRunner';
import HotkeysService from './services/hotkeys';

const { ipcRenderer, remote } = window.require('electron');

require('./app.less');

document.addEventListener('DOMContentLoaded', () => {
  const query = URI.parseQuery(URI.parse(window.location.href).query);
  const isChild = query.child;

  if (isChild) {
    store.dispatch({ type: 'setWindowAsChild' });
    store.dispatch({
      type: 'setWindowOptions',
      options: _.omit(query, ['child'])
    });

    ipcRenderer.on('closeWindow', () => {
      windowManager.closeWindow();
    });
  } else {
    configFileManager.load();

    ipcRenderer.on('shutdown', () => {
      configFileManager.save();
      remote.getCurrentWindow().close();
    });

    store.dispatch({
      type: 'setWindowOptions',
      options: {
        component: 'Main'
      }
    });

    const periodicRunner = new PeriodicRunner();
    periodicRunner.start();

    HotkeysService.instance.bindAllHotkeys();
  }

  window.obs = Obs.nodeObs;

  const vm = new Vue({
    el: '#app',
    store,
    render: h => {
      const componentName = store.state.windowOptions.options.component;

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
    // from the URL, allows child windows to be refreshed without
    // losing their contents.
    let newOptions = Object.assign({ child: isChild }, options);
    let newURL = URI(window.location.href).query(newOptions).toString()

    window.history.replaceState({}, '', newURL);
  });
});
