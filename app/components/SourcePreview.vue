<template>
<div>
  <canvas ref="canvas" width="1280" height="720"/>
  <button @click="startVideo" class="button">
    Start Video
  </button>
  <button @click="stopVideo" class="button">
    Stop Video
  </button>
</div>
</template>

<script>
// This component displays a WebGL accelerated preview of
// the provided source

import renderer from 'webgl-video-renderer';
import Obs from '../api/Obs.js';

import VideoStreaming from '../util/VideoStreaming.js';

export default {

  props: ['source'],

  mounted() {
    let canvas = this.$refs.canvas;
    this.renderctx = renderer.setupCanvas(canvas);
  },

  methods: {
    startVideo() {
      VideoStreaming.startStreaming(this.source.name, frameBuffer => {
        this.refresh(frameBuffer);
      });
    },

    stopVideo() {
      VideoStreaming.stopStreaming();
    },

    refresh(frameBuffer) {
      this.renderctx.render(frameBuffer, 1280, 720, 1280*720, (1280*720) + (1280*720)/4 );
    }
  }

};
</script>
