<template>
<div>
  <canvas
    class="StudioEditorSources"
    ref="preview"
    :width="width"
    :height="height"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseLeave"
    @mouseenter="handleMouseEnter"/>
</div>
</template>

<script>
import _ from 'lodash';
import Obs from '../api/Obs.js';
const { webFrame, screen, remote } = window.require('electron')

export default {

  mounted() {
    this.streamedSources = {};
    var browser = remote.getCurrentWindow();
    Obs.createDisplay('Main Window');
    this.onResize();

    browser.show();

    window.addEventListener('resize', this.onResize);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);

    Obs.destroyDisplay('Main Window');
  },

  methods: {
    // Gets properly scaled mouse coordinates within the preview
    getLocalMouseCoordinates(event) {
      const preview = this.$refs.preview;

      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

      const rect = preview.getBoundingClientRect();

      const scalingRatioWidth = this.width / preview.offsetWidth * factor;
      const scalingRatioHeight = this.height / preview.offsetHeight * factor;

      const x = (event.clientX - rect.left) * scalingRatioWidth;
      const y = (event.clientY - rect.top)  * scalingRatioHeight;

      return {
        x,
        y
      };
    },

    handleMouseDown(event) {
      this.mouseDown = true;

      const coords = this.getLocalMouseCoordinates(event);

      Obs.selectSource(coords.x, coords.y);
    },

    handleMouseMove(event) {
      if (this.mouseDown && !this.mouseOut) {
        const coords = this.getLocalMouseCoordinates(event);

        Obs.dragSelectedSource(coords.x, coords.y);
      }
    },

    handleMouseUp() {
      this.mouseDown = false;
    },

    handleMouseLeave() {
      this.mouseOut = true;
    },

    handleMouseEnter(event) {
      this.mouseOut = false;
      this.mouseDown = event.buttons === 1;
    },

    onResize() {
      const preview = this.$refs.preview;
      const rect = preview.getBoundingClientRect();
      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

      Obs.resizeDisplay(
        'Main Window',
        rect.width * factor,
        rect.height * factor
      );

      Obs.moveDisplay(
        'Main Window',
        rect.left * factor,
        rect.top * factor
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
