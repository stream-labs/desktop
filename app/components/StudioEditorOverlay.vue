<template>
<canvas
  class="StudioEditorOverlay"
  ref="canvas"
  :width="width"
  :height="height"
  @mousedown="handleMousedown"
  @mousemove="handleMousemove"
  @mouseup="handleMouseup"
  @mouseleave="handleMouseup"/>
</template>

<script>
import _ from 'lodash';

export default {

  data() {
    return {
      // This is how pany pixels larger the overlay is on each edge
      // compared to the original source.  This is so that we can
      // draw overlay elements that go a bit outside the video frame.
      gutterSize: 10
    }
  },

  methods: {
    handleMousedown(e) {
    },

    handleMousemove(e) {
    },

    handleMouseup(e) {
    },
  },

  computed: {
    activeSource() {
      return this.$store.getters.activeSource;
    },

    videoWidth() {
      return this.$store.state.video.width;
    },

    videoHeight() {
      return this.$store.state.video.height;
    },

    width() {
      return this.$store.state.video.renderedWidth + this.gutterSize * 2;
    },

    height() {
      return this.$store.state.video.renderedHeight + this.gutterSize * 2;
    },

    sources() {
      return _.map(this.$store.getters.activeScene.sources, sourceId => {
        return this.$store.state.sources.sources[sourceId];
      });
    },
  }
};
</script>

<style lang="less" scoped>
.StudioEditorOverlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;

  z-index: 1000;
}
</style>
