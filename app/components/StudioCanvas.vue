<template>
<div class="StudioCanvas">
  <!-- <source-preview :source="sources[0]"/> -->
  <studio-canvas-overlay/>
</div>
</template>

<script>
import SourcePreview from './SourcePreview.vue';
import StudioCanvasOverlay from './StudioCanvasOverlay.vue';
import _ from 'lodash';

export default {

  components: {
    SourcePreview,
    StudioCanvasOverlay
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
    },

    aspectRatio() {
      return this.$store.getters.aspectRatio;
    }
  }

};
</script>

<style lang="less" scoped>
.StudioCanvas {
  position: relative;
  flex-grow: 1;
  background-color: #222;
}
</style>
