<template>
<canvas ref="canvas"
        :width="width"
        :height="height"/>
</template>

<script>
import WebGLRenderer from '../util/WebGLRenderer.js';
import SourceFrameStream from '../util/SourceFrameStream.js';
import Obs from '../api/Obs.js';
export default {

  props: ['sourceId'],

  computed: {
    width() {
      return this.$store.state.video.width;
    },

    height() {
      return this.$store.state.video.height;
    }
  }
};
</script>
