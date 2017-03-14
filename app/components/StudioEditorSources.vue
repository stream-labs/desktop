<template>
<div>
  <button
    class="StudioEditorSources-button button"
    @click="startVideo">
    Start Video
  </button>
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

import YUVBuffer from 'yuv-buffer';
import YUVCanvas from 'yuv-canvas';
import WebGLRenderer from '../util/WebGLRenderer.js';

import _ from 'lodash';

import Obs from '../api/Obs.js';

export default {

  mounted() {
    let canvas = this.$refs.canvas;

    this.mainCanvas = canvas.getContext('2d');

    window.addEventListener('resize', this.onResize);

    this.onResize();
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  },

  methods: {
    onResize() {
      this.$store.dispatch({
        type: 'setVideoRenderedSize',
        width: this.$refs.canvas.offsetWidth,
        height: this.$refs.canvas.offsetHeight
      });
    },

    setupYUVCanvas(canvas) {
      let yuv = YUVCanvas.attach(canvas);

      return data => {
        let format = YUVBuffer.format({
          width: data.width,
          height: data.height,

          chromaWidth: data.width / 2,
          chromaHeight: data.height / 2
        });

        let y = YUVBuffer.lumaPlane(format);
        y.bytes = data.frameBuffer.subarray(0, data.width * data.height);

        let u = YUVBuffer.chromaPlane(format);
        u.bytes = data.frameBuffer.subarray(data.width * data.height, (data.width * data.height) + (data.width * data.height) / 4);

        let v = YUVBuffer.chromaPlane(format);
        v.bytes = data.frameBuffer.subarray((data.width * data.height) + (data.width * data.height) / 4);

        let yuvFrame = YUVBuffer.frame(format, y, u, v);

        yuv.drawFrame(yuvFrame);
      };
    },

    setupRGBACanvas(canvas) {
      let renderer = new WebGLRenderer(canvas);

      return data => {
        renderer.drawFrame(data.frameBuffer, data.width, data.height);
      };
    },

    startVideo() {
      if (!this.videoStarted) {
        this.videoStarted = true;

        let canvases = {};

        _.each(this.sources, source => {
          let canvas = document.createElement('canvas');

          canvases[source.id] = canvas;

          let renderMethod;
          let width;
          let height;

          SourceFrameStream.subscribeToSource(source.name, data => {
            if ((width !== data.width) || (height !== data.height)) {
              width = data.width;
              height = data.height;

              this.$store.dispatch({
                type: 'setSourceSize',
                sourceId: source.id,
                width,
                height
              });
            }

            if (!renderMethod) {
              if (data.format === 0) {
                renderMethod = this.setupYUVCanvas(canvas);
              } else {
                renderMethod = this.setupRGBACanvas(canvas);
              }
            }

            renderMethod(data);
          });
        });


        setInterval(() => {
          this.mainCanvas.clearRect(0, 0, this.width, this.height);

          _.each(this.sources, source => {
            this.mainCanvas.drawImage(canvases[source.id], source.x, source.y);
          });

        }, 33);

      }
    }
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
