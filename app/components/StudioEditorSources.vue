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
const { webFrame, screen } = window.require('electron')

export default {

  mounted() {
    this.streamedSources = {};

    window.addEventListener('resize', this.onResize);

    this.onResize();

    // this.$refs.canvas.onclick = function(){console.log('mouse click event');};
    // this.$refs.canvas.onmousemove = function(){console.log('mouse move event');};
    let canvasToDrag = this.$refs.canvas;
    let downFlag = false;
    // canvasToDrag.onmousedown = function(){canvasToDrag.onmousemove = function(){console.log('drag event');};};

    var position = {
      X: 0,
      Y: 0
    };

    canvasToDrag.onmousedown = function (down) {
      downFlag = true;

      var box = canvasToDrag.getBoundingClientRect();

      var body = document.body;
      var docEl = document.documentElement;

      var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
      var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

      var clientTop = docEl.clientTop || body.clientTop || 0;
      var clientLeft = docEl.clientLeft || body.clientLeft || 0;

      var top  = box.top +  scrollTop - clientTop;
      var left = box.left + scrollLeft - clientLeft;

      var pos = { 
        top: Math.round(top), 
        left: Math.round(left) 
      };

      var factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

      var scalingRatioWidth = 1280 / canvasToDrag.getBoundingClientRect().width * factor;
      var scalingRatioHeight = 720 / canvasToDrag.getBoundingClientRect().height * factor;

      var x = (down.clientX - pos.left - window.scrollX)*scalingRatioWidth;
      var y = (down.clientY - pos.top - window.scrollY)*scalingRatioHeight;

      Obs.selectSource(x, y);
    };

    canvasToDrag.onmouseup = function (up) {
      downFlag = false;
    };
    canvasToDrag.onmouseout = function (move) {
      // downFlag = false;
      // console.log('leave');
    }

    canvasToDrag.onmousemove = function (move) {
      var box = canvasToDrag.getBoundingClientRect();

      var body = document.body;
      var docEl = document.documentElement;

      var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
      var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

      var clientTop = docEl.clientTop || body.clientTop || 0;
      var clientLeft = docEl.clientLeft || body.clientLeft || 0;

      var top  = box.top +  scrollTop - clientTop;
      var left = box.left + scrollLeft - clientLeft;

      var pos = { 
        top: Math.round(top), 
        left: Math.round(left) 
      };

      if (downFlag) {
        if (position.X !== move.clientX || position.Y !== move.clientY) {
          var factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

          var scalingRatioWidth = 1280 / canvasToDrag.getBoundingClientRect().width * factor;
          var scalingRatioHeight = 720 / canvasToDrag.getBoundingClientRect().height * factor;

          var x = (move.clientX - pos.left - window.scrollX)*scalingRatioWidth;
          var y = (move.clientY - pos.top - window.scrollY)*scalingRatioHeight;

          // console.log(x,y);
          Obs.dragSelectedSource(x, y);
        }
      }
    };


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
      var factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

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
