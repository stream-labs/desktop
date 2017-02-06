import App from './components/App.vue';
import Vue from 'vue';
import store from './store';
import Obs from './api/Obs.js';

require('./app.less');

document.addEventListener('DOMContentLoaded', function() {
  Obs.init();

  new Vue({
    el: '#app',
    store,
    render: h => h(App)
  });
});
