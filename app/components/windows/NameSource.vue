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

export default {

  components: {
    ModalLayout
  },

  methods: {
    submit() {
      this.$store.dispatch({
        type: 'createSourceAndAddToScene',
        sceneName: this.$store.getters.activeSceneName,
        sourceType: window.startupOptions.sourceType,
        sourceName: this.name,
        settings: {},
        hotkeyData: {}
      });

      windowManager.showSourceProperties(true, this.name);
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
