<template>
<modal-layout
  :title="windowTitle"
  :show-controls="true"
  :done-handler="done"
  :no-content-padding="true">
  <div slot="content">
    <div class="SourceProperties-preview">
    </div>
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
    done() {
      console.log('Source Properties Submit');
    }
  },

  computed: {
    windowTitle() {
      return "Properties for '" + window.startupOptions.sourceName + "'";
    }
  }

}
</script>

<style lang="less" scoped>
.SourceProperties-preview {
  height: 220px;
  background-color: black;
}
</style>
