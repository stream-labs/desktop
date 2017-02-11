<template>
<modal-layout title="Name Source">
  <form
    slot="content"
    id="nameForm"
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
  <div slot="controls" class="NameSource-controls">
    <button
      class="button button--default"
      @click="cancel">
      Cancel
    </button>
    <button
      class="button button--action NameSource-button"
      type="submit"
      form="nameForm">
      Submit
    </button>
  </div>
</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import windowManager from '../../util/WindowManager.js';

export default {

  components: {
    ModalLayout
  },

  methods: {
    cancel() {
      windowManager.closeWindow();
    },

    submit() {
      this.$store.dispatch({
        type: 'createSourceAndAddToScene',
        sceneName: this.$store.getters.activeSceneName,
        sourceType: window.startupOptions.sourceType,
        sourceName: this.name,
        settings: {},
        hotkeyData: {}
      });

      windowManager.closeWindow();
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
.NameSource-controls {
  padding: 15px 30px;
  text-align: right;
}

.NameSource-button {
  margin-left: 15px;
}

.NameSource-label {
  margin-bottom: 10px;
}
</style>
