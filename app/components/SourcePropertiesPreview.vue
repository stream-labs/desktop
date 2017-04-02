<template>
<canvas ref="canvas"/>
</template>

<script>
import WebGLRenderer from '../util/WebGLRenderer.js';
import SourceFrameStream from '../util/SourceFrameStream.js';

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
  },

  beforeDestroy() {
    SourceFrameStream.unsubscribe(this.sourceId, this.subId);
  }

};
</script>
