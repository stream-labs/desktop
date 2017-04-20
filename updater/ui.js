// This is the entry point into the updater app

import Vue from 'vue';
import UpdaterWindow from './UpdaterWindow.vue';

document.addEventListener('DOMContentLoaded', () => {

  new Vue({
    el: '#app',
    render: createEl => {
      return createEl(UpdaterWindow);
    }
  });

});
