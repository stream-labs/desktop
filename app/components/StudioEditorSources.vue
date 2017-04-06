<template>
<div>
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
import _ from 'lodash';
import Obs from '../api/Obs.js';
const { webFrame } = window.require('electron')

export default {

  mounted() {
    this.streamedSources = {};

    window.addEventListener('resize', this.onResize);

    this.onResize();
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);

    clearInterval(this.renderInterval);
  },

  methods: {
    // http://stackoverflow.com/questions/5598743/finding-elements-position-relative-to-the-document
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
      var factor = webFrame.getZoomFactor();

      Obs.resizeDisplay(
        'Main Window',
        rect.width * factor,
        rect.height * factor
      );

      Obs.moveDisplay(
        'Main Window',
        (pos.left - window.scrollX) * factor,
        (pos.top - window.scrollY) * factor
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

<style scoped>
.StudioEditorSources {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 10px;
  right: 10px;
  margin: auto;
  max-width: calc(100% - 20px);
  max-height: 100%;
}

.StudioEditorSources-button {
  position: absolute;
  top: 10px;
  left: 10px;
}
</style>
