window.eval = global.eval = function() {
  throw new Error("window.eval() is disabled for security");
}

import App from './components/App.vue';
import Vue from 'vue';
import store from './store';
import Obs from './api/Obs.js';
import windowManager from './util/WindowManager.js';

require('./app.less');

document.addEventListener('DOMContentLoaded', function() {
  const component = window.location.search.match(/^\?component=(.*)$/);

  if (component && component[1]) {
    // This is a child window

    new Vue({
      el: '#app',
      store: store,
      render: h => h(windowManager.components[component[1]])
    });
  } else {
    // This is the main window
    Obs.init();

    store.dispatch('initTestData');

    window.MAIN_WINDOW = true;

    new Vue({
      el: '#app',
      store,
      render: h => h(App)
    });
  }
});
