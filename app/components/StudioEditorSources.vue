<template>
<div>
  <canvas
    class="StudioEditorSources"
    ref="canvas"
    :width="width"
    :height="height"
    @resize="onResize"/>
</div>
</template>

<script>
import SourceFrameStream from '../util/SourceFrameStream.js';
import _ from 'lodash';
import Obs from '../api/Obs.js';

export default {

  mounted() {
    this.streamedSources = {};

    window.addEventListener('resize', this.onResize);

    this.onResize();
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);

    // Unsubscribe from all sources
    _.each(this.streamedSources, streamed => {
      SourceFrameStream.unsubscribe(streamed.id, streamed.subId);
    });

    clearInterval(this.renderInterval);
  },

  methods: {
    onResize() {
      Obs.resizeDisplay(
        'Main Window',
        this.$refs.canvas.offsetWidth,
        this.$refs.canvas.offsetHeight
      );

      var offsetParent = this.$refs.canvas.offsetParent;

      Obs.moveDisplay(
        'Main Window',
        this.$refs.canvas.offsetLeft,
        offsetParent.offsetTop + this.$refs.canvas.offsetTop
      );

      this.$store.dispatch({
        type: 'setVideoRenderedSize',
        width: this.$refs.canvas.offsetWidth,
        height: this.$refs.canvas.offsetHeight
      });
    },
  },

  computed: {
    sources() {
      return _.map(this.$store.getters.activeScene.sources, sourceId => {
        return this.$store.state.sources.sources[sourceId];
      });
    },

    width() {
      return this.$store.state.video.width;
    },

    height() {
      return this.$store.state.video.height;
    }
  }

};
</script>

<style scoped>
.StudioEditorSources {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 10px;
  right: 10px;
  margin: auto;
  max-width: calc(100% - 20px);
  max-height: 100%;

  background-color: black;
}

.StudioEditorSources-button {
  position: absolute;
  top: 10px;
  left: 10px;
}
</style>
