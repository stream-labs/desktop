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
      windowManager.showSourceProperties(true, {
        sourceName: this.name,
        sourceType: window.startupOptions.sourceType,
        isNew: true
      });
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
