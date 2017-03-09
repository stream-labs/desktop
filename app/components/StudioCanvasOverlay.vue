<template>
<div>
  <button
    class="StudioCanvasOverlay-button button"
    @click="startVideo">
    Start Video
  </button>
  <canvas
    width="1920"
    height="1080"
    class="StudioCanvasOverlay"
    ref="canvas"/>
</div>
</template>

<script>
import SourceFrameStream from '../util/SourceFrameStream.js';

import YUVBuffer from 'yuv-buffer';
import YUVCanvas from 'yuv-canvas';

export default {

  mounted() {
    let canvas = this.$refs.canvas;

    this.mainCanvas = canvas.getContext('2d');

    this.videoCanvas = document.createElement('canvas');
    this.videoCanvas.width = 1280;
    this.videoCanvas.height = 720;

    this.format = YUVBuffer.format({
      width: 1280,
      height: 720,

      chromaWidth: 1280 / 2,
      chromaHeight: 720 /2
    });

    this.yuv = YUVCanvas.attach(this.videoCanvas);
  },

  methods: {
    startVideo() {
      if (!this.videoStarted) {
        this.videoStarted = true;

        let frame = SourceFrameStream.subscribeToSource('Video Capture 1', 1280 * 720 * 1.5, function() {
          requestAnimationFrame(drawFrame);
        });

        let y = YUVBuffer.lumaPlane(this.format);
        y.bytes = frame.subarray(0, 1280*720);

        let u = YUVBuffer.chromaPlane(this.format);
        u.bytes = frame.subarray(1280*720, (1280*720) + (1280*720)/4);

        let v = YUVBuffer.chromaPlane(this.format);
        v.bytes = frame.subarray((1280*720) + (1280*720)/4);

        let yuvFrame = YUVBuffer.frame(this.format, y, u, v);

        let drawFrame = () => {
          this.yuv.drawFrame(yuvFrame);
          this.mainCanvas.drawImage(this.videoCanvas, 0, 0);
        };

      }
    }
  }

};
</script>

<style lang="less" scoped>
.StudioCanvasOverlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  max-width: 100%;
  max-height: 100%;

  background-color: black;
}

.StudioCanvasOverlay-button {
  position: absolute;
  top: 10px;
  left: 10px;
}
</style>
