<template>
<canvas ref="canvas"
        :width="width"
        :height="height"
        @resize="onResize"/>
</template>

<script>
import WebGLRenderer from '../util/WebGLRenderer.js';
import SourceFrameStream from '../util/SourceFrameStream.js';
import Obs from '../api/Obs.js';
export default {

  props: ['sourceId'],

  mounted() {
    window.addEventListener('resize', this.onResize);
    this.onResize();
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  },

  methods: {
    getCoords(elem) { // crossbrowser version
        var box = elem.getBoundingClientRect();

        var body = document.body;
        var docEl = document.documentElement;

        var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
        var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

        var clientTop = docEl.clientTop || body.clientTop || 0;
        var clientLeft = docEl.clientLeft || body.clientLeft || 0;

        var top  = box.top +  scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;

        return { top: Math.round(top), left: Math.round(left) };
    },

    onResize() {
      var canvas = this.$refs.canvas;
      var rect = canvas.getBoundingClientRect();
      var pos = this.getCoords(canvas);

      console.log('resize to ', rect.width, 'x', rect.height);
      console.log('move to ', pos.left - window.scrollX, ',', pos.top - window.scrollY);

      Obs.resizeDisplay(
        'Preview Window',
        rect.width,
        rect.height
      );

      Obs.moveDisplay(
        'Preview Window',
        pos.left - window.scrollX,
        pos.top - window.scrollY
      );
    },
  },

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
