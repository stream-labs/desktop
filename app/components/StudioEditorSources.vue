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
    @mouseleave="handleMouseLeave"/>
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
    handleMouseDown(event) {
      this.downFlag = true;

      const preview = this.$refs.preview;

      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

      const rect = preview.getBoundingClientRect();

      const scalingRatioWidth = this.width / preview.offsetWidth * factor;
      const scalingRatioHeight = this.height / preview.offsetHeight * factor;

      var x = (event.clientX - rect.left) * scalingRatioWidth;
      var y = (event.clientY - rect.top)  * scalingRatioHeight;

      Obs.selectSource(x, y);
    },

    handleMouseMove(event) {
      if (this.downFlag) {
        const preview = this.$refs.preview;

        const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

        const rect = preview.getBoundingClientRect();

        const scalingRatioWidth = this.width / preview.offsetWidth * factor;
        const scalingRatioHeight = this.height / preview.offsetHeight * factor;

        var x = (event.clientX - rect.left) * scalingRatioWidth;
        var y = (event.clientY - rect.top) * scalingRatioHeight;

        Obs.dragSelectedSource(x, y);
      }
    },

    handleMouseUp() {
      this.downFlag = false;
    },

    handleMouseLeave() {
      this.downFlag = false;
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
        (rect.left - window.scrollX) * factor,
        (rect.top - window.scrollY) * factor
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
