<template>
<div>
  <button
    class="StudioEditorSources-button button"
    @click="startVideo">
    Start Video
  </button>
  <canvas
    width="1920"
    height="1080"
    class="StudioEditorSources"
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
            let canvas = document.createElement('canvas');
            canvas.width = settings.width;
            canvas.height = settings.height;

            source.canvas = canvas;

            let yuv = YUVCanvas.attach(canvas);

            SourceFrameStream.subscribeToSource(source.name, data => {
              let format = YUVBuffer.format({
                width: settings.width,
                height: settings.height,

                chromaWidth: settings.width / 2,
                chromaHeight: settings.height / 2
              });

              let y = YUVBuffer.lumaPlane(format);
              y.bytes = data.frameBuffer.subarray(0, data.width * data.height);

              let u = YUVBuffer.chromaPlane(format);
              u.bytes = data.frameBuffer.subarray(settings.width * settings.height, (settings.width * settings.height) + (settings.width * settings.height) / 4);

              let v = YUVBuffer.chromaPlane(format);
              v.bytes = data.frameBuffer.subarray((settings.width * settings.height) + (settings.width * settings.height) / 4);

              let yuvFrame = YUVBuffer.frame(format, y, u, v);

              yuv.drawFrame(yuvFrame);
            });
          } else {
            let canvas = document.createElement('canvas');

            let renderer = new WebGLRenderer(canvas);

            source.canvas = canvas;

            SourceFrameStream.subscribeToSource(source.name, data => {
              renderer.drawFrame(data.frameBuffer, data.width, data.height);
            });
          }
        });

        setInterval(() => {
          _.each(sources, source => {
            this.mainCanvas.drawImage(source.canvas, source.x, source.y);
          });

        }, 33);

      }
    }
  }

};
</script>

<style lang="less" scoped>
.StudioEditorSources {
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

.StudioEditorSources-button {
  position: absolute;
  top: 10px;
  left: 10px;
}
</style>
