<template>
<div class="StudioCanvas">
  <studio-canvas-overlay/>
</div>
</template>

<script>
import StudioCanvasOverlay from './StudioCanvasOverlay.vue';
import _ from 'lodash';

export default {

  components: {
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
