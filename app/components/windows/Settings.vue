<template>
<modal-layout
  title="Settings"
  :show-controls="true"
  :done-handler="done">
  <div slot="content">
    <label>Stream Key</label>
    <input
      type="text"
      v-model="streamKey"/>
  </div>
</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import Obs from '../../api/Obs.js';
import windowManager from '../../util/WindowManager';
const fs = window.require('fs');

const serviceConfigPath = './config/service.json';

export default {

  components: {
    ModalLayout
  },

  methods: {
    done() {
      this.service.settings.key = this.streamKey;

      const json = JSON.stringify(this.service, null, 4);

      fs.writeFileSync(serviceConfigPath, json);

      Obs.resetService();
      windowManager.closeWindow();
    }
  },

  data() {
    // TODO: This should really be stored in memory rather than
    // reading it from the file every time.  This is a temporary
    // solution.
    this.service = JSON.parse(fs.readFileSync(serviceConfigPath));
    const streamKey = this.service.settings.key;

    return {
      streamKey
    };
  }

};
</script>
