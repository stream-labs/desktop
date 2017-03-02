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
import VideoStreaming from '../util/VideoStreaming.js';
import renderer from 'webgl-video-renderer';

export default {

  mounted() {
    let canvas = this.$refs.canvas;

    this.mainCanvas = canvas.getContext('2d');
    
    this.videoCanvas = document.createElement('canvas');
    this.videoCanvas.width = 1280;
    this.videoCanvas.height = 720;

    this.videoContext = renderer.setupCanvas(this.videoCanvas);
  },

  methods: {
    startVideo() {
      VideoStreaming.startStreaming('Video Capture 1', frame => {
        this.videoContext.render(frame, 1280, 720, 1280*720, (1280*720) + (1280*720)/4 );
        this.mainCanvas.drawImage(this.videoCanvas, 0, 0);
      });
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
