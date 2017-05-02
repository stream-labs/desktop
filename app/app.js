window.eval = global.eval = function() {
  throw new Error("window.eval() is disabled for security");
}

import Vue from 'vue';
import store from './store';
import Obs from './api/Obs.js';
import windowManager from './util/WindowManager.js';
import URI from 'urijs';
import contextMenuManager from './util/ContextMenuManager.js';
import configFileManager from './util/ConfigFileManager.js';
import _ from 'lodash';
const { ipcRenderer, remote } = window.require('electron');

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

    // TODO: Create a class that handles periodic "jobs" like this
    // so we can stop polluting app.js.  This is a mess.  I take
    // full responsibility.  :(

    // This is an autosave interval that saves every minute.
    setInterval(() => {
      configFileManager.save();
    }, 60 * 1000);

    // This updates information about sources every second. Obs
    // does not provide any mechanism to know when this changes,
    // so we have no option but to poll.
    setInterval(() => {
      _.each(store.state.sources.sources, source => {
        const size = Obs.getSourceSize(source.name);

        if ((source.width !== size.width) || (source.height !== size.height)) {
          store.dispatch({
            type: 'setSourceSize',
            sourceId: source.id,
            width: size.width,
            height: size.height
          });
        }

        const flags = Obs.getSourceFlags(source.name);
        const audio = !!flags.audio;
        const video = !!flags.video;

        if ((source.audio !== audio) || (source.video !== video)) {
          store.dispatch({
            type: 'setSourceFlags',
            sourceId: source.id,
            audio,
            video
          });
        }
      });
    }, 1000);

    // Update performance stats every 2 seconds
    setInterval(() => {
      store.dispatch('refreshPerformanceStats');
    }, 2000);
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
    console.log("dispatch setWindowOptions");
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
