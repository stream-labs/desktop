import App from './components/App.vue';
import Vue from 'vue';
import store from './store';

require('./app.less');

document.addEventListener('DOMContentLoaded', function() {
  new Vue({
    el: '#app',
    store,
    render: h => h(App)
  });
});
