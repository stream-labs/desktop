import App from './components/App.vue';
import Vue from 'vue';
import store from './store';

require('./app.less');

// This is the 
require('./twitchalerts.css');

document.addEventListener('DOMContentLoaded', function() {
  new Vue({
    el: '#app',
    store,
    render: h => h(App)
  });
});
