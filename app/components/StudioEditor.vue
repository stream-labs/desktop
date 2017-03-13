<template>
<div class="StudioEditor">
  <studio-editor-sources/>
</div>
</template>

<script>
import StudioEditorSources from './StudioEditorSources.vue';
import _ from 'lodash';

export default {

  components: {
    StudioEditorSources
  },

  data() {
    return {

    };
  },

  computed: {
    sources() {
      return _.map(this.$store.getters.activeScene.sources, sourceId => {
        return this.$store.state.sources.sources[sourceId];
      });
    }
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
