<template>
<div class="StudioEditor">
  <studio-editor-display/>
</div>
</template>

<script>
import StudioEditorDisplay from './StudioEditorDisplay.vue';
import _ from 'lodash';

export default {

  components: {
    StudioEditorDisplay
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
