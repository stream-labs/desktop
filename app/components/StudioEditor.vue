<template>
<div class="StudioEditor">
  <studio-editor-sources/>
  <studio-editor-overlay/>
</div>
</template>

<script>
import StudioEditorSources from './StudioEditorSources.vue';
import StudioEditorOverlay from './StudioEditorOverlay.vue';
import _ from 'lodash';

export default {

  components: {
    StudioEditorSources,
    StudioEditorOverlay
  }

};
</script>

<style lang="less" scoped>
.StudioEditor {
  position: relative;
  flex-grow: 1;
  background-color: #222;
}
</style>
