<template>
<modal-layout
  title="Name Source"
  :show-controls="true"
  :done-handler="submit">
  <form
    slot="content"
    @submit.prevent="submit">
    <p
      class="NameSource-label">
      Please enter the name of the source
    </p>
    <input
      autofocus
      type="text"
      v-model="name"/>
  </form>
</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import windowManager from '../../util/WindowManager.js';
const { ipcRenderer } = window.require('electron');

export default {

  components: {
    ModalLayout
  },

  methods: {
    submit() {
      // Choose a unique id for the source
      const id = ipcRenderer.sendSync('getUniqueId');

      this.$store.dispatch({
        type: 'createSourceAndAddToScene',
        sceneName: this.$store.getters.activeSceneName,
        sourceType: window.startupOptions.sourceType,
        sourceName: this.name,
        sourceId: id
      });

      windowManager.showSourceProperties(true, id);
    }
  },

  data() {
    return {
      name: window.startupOptions.sourceType
    };
  }

};
</script>

<style lang="less" scoped>
.NameSource-label {
  margin-bottom: 10px;
}
</style>
