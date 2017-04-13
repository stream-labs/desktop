<template>
<div
  class="StudioEditor-display"
  ref="display"
  @mousedown="handleMouseDown"
  @mouseup="handleMouseUp"
  @mousemove="handleMouseMove"/>
</template>

<script>
import Obs from '../api/Obs.js';
const { webFrame, screen, remote } = window.require('electron');

export default {

  mounted() {
    Obs.createDisplay('Main Window');
    this.onResize();

    remote.getCurrentWindow().show();

    window.addEventListener('resize', this.onResize);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);

    Obs.destroyDisplay('Main Window');
  },

  methods: {
    onResize() {
      const display = this.$refs.display;
      const rect = display.getBoundingClientRect();
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

    /*****************
    * Mouse Handling *
    *****************/

    handleMouseDown(event) {

    },

    handleMouseUp(event) {

    },

    handleMouseMove(event) {

    }
  }

};
</script>

<style lang="less" scoped>
.StudioEditor-display {
  position: relative;
  flex-grow: 1;
  background-color: #222;
}
</style>
