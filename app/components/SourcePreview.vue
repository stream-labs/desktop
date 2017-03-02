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

import YUVCanvas from 'yuv-canvas';
import YUVBuffer from 'yuv-buffer';
import Obs from '../api/Obs.js';

import VideoStreaming from '../util/VideoStreaming.js';

export default {

  props: ['source'],

  mounted() {
    let canvas = this.$refs.canvas;
    this.yuv = YUVCanvas.attach(canvas);

    this.format = YUVBuffer.format({
      width: 1280,
      height: 720,

      chromaWidth: 1280 / 2,
      chromaHeight: 720 / 2
    });
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
      let start = performance.now();

      let y = YUVBuffer.lumaPlane(
        this.format,
        frameBuffer,
        0,
        0
      );

      let u = YUVBuffer.chromaPlane(
        this.format,
        frameBuffer,
        0,
        1280 * 720
      );

      let v = YUVBuffer.chromaPlane(
        this.format,
        frameBuffer,
        0,
        (1280*720) + (1280*720)/4
      );

      let frame = YUVBuffer.frame(this.format, y, u, v);

      this.yuv.drawFrame(frame);

      let end = performance.now();

      console.log("DRAW FRAME", end - start);
    }
  }

};
</script>
