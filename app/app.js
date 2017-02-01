import App from './components/App.vue';
import Vue from 'vue';

document.addEventListener('DOMContentLoaded', function() {
  new Vue({
    el: '#app',
    render: h => h(App)
  });
});
