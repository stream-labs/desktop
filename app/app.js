window.eval = global.eval = function() {
  throw new Error("window.eval() is disabled for security");
}

import Vue from 'vue';
import store from './store';
import Obs from './api/Obs.js';
import windowManager from './util/WindowManager.js';
import URI from 'urijs';
import contextMenuManager from './util/ContextMenuManager.js';

require('./app.less');

document.addEventListener('DOMContentLoaded', function() {
  // These are options passed into this window when
  // it was created.  They are unique to this window,
  // and should be considered immutable, except when doing
  // an in-place window replacement.
  window.startupOptions = URI.parseQuery(URI.parse(window.location.href).query);

  window.obs = Obs.nodeObs;

  let vm = new Vue({
    el: '#app',
    store: store,
    render: h => h(windowManager.components[startupOptions.component])
  });

  // Initialize the custom context menu system
  contextMenuManager.init();

  window.reset = () => {
    vm.$forceUpdate();
  };
});
