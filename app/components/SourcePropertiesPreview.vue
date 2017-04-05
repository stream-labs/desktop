<template>
<canvas ref="canvas"
        @resize="onResize"/>
</template>

<script>
import WebGLRenderer from '../util/WebGLRenderer.js';
import SourceFrameStream from '../util/SourceFrameStream.js';
import Obs from '../api/Obs.js';
export default {

  props: ['sourceId'],

  mounted() {
    let canvas = this.$refs.canvas;

    let renderer = new WebGLRenderer(canvas);

    this.subId = SourceFrameStream.subscribe(this.sourceId, frameInfo => {
      // Only support RGBA for now
      if (frameInfo.format === 1) {
        renderer.drawFrame(
          frameInfo.frameBuffer,
          frameInfo.width,
          frameInfo.height
        );
      }
    });
    window.addEventListener('resize', this.onResize);
  },

  beforeDestroy() {
    SourceFrameStream.unsubscribe(this.sourceId, this.subId);
    window.removeEventListener('resize', this.onResize);
  },

  methods: {
    onResize() {
      var rect = this.$refs.canvas.getBoundingClientRect();

      Obs.resizeDisplay(
        'Preview Window',
        rect.width,
        rect.height
      );

      Obs.moveDisplay(
        'Preview Window',
        rect.left,
        rect.top
      );

      this.$store.dispatch({
        type: 'setVideoRenderedSize',
        width: this.$refs.canvas.offsetWidth,
        height: this.$refs.canvas.offsetHeight
      });
    },
  }
};
</script>
