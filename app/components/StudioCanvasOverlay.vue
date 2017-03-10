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
import WebGLRenderer from '../util/WebGLRenderer.js';

import _ from 'lodash';

import Obs from '../api/Obs.js';

export default {

  mounted() {
    let canvas = this.$refs.canvas;

    this.mainCanvas = canvas.getContext('2d');
  },

  methods: {
    startVideo() {
      if (!this.videoStarted) {
        this.videoStarted = true;

        let sources = [
          {
            name: 'Video Capture Device',
            x: 0,
            y: 0
          },
          {
            name: 'Window Capture',
            x: 700,
            y: 300
          }
        ];

        _.each(sources, source => {
          let settings = Obs.getSourceFrameSettings(source.name);

          if (settings.format === 'VIDEO_FORMAT_UYVY') {
            let frameLength = settings.width * settings.height * 1.5;

            let frame = SourceFrameStream.subscribeToSource(source.name, frameLength, function() {});

            let canvas = document.createElement('canvas');
            canvas.width = settings.width;
            canvas.height = settings.height;

            let format = YUVBuffer.format({
              width: settings.width,
              height: settings.height,

              chromaWidth: settings.width / 2,
              chromaHeight: settings.height / 2
            });

            let y = YUVBuffer.lumaPlane(format);
            y.bytes = frame.subarray(0, settings.width * settings.height);

            let u = YUVBuffer.chromaPlane(format);
            u.bytes = frame.subarray(settings.width * settings.height, (settings.width * settings.height) + (settings.width * settings.height) / 4);

            let v = YUVBuffer.chromaPlane(format);
            v.bytes = frame.subarray((settings.width * settings.height) + (settings.width * settings.height) / 4);

            let yuvFrame = YUVBuffer.frame(format, y, u, v);

            let yuv = YUVCanvas.attach(canvas);

            source.canvas = canvas;

            source.render = () => {
              yuv.drawFrame(yuvFrame);
            };
          } else {
            let frameLength = settings.width * settings.height * 4;

            let frame = SourceFrameStream.subscribeToSource(source.name, frameLength, function() {});
            let canvas = document.createElement('canvas');

            let renderer = new WebGLRenderer(canvas, settings.width, settings.height);

            source.canvas = canvas;

            source.render = () => {
              renderer.drawFrame(frame);
            };
          }
        });

        setInterval(() => {
          _.each(sources, source => {
            source.render();
            this.mainCanvas.drawImage(source.canvas, source.x, source.y);
          });

        }, 33);

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
