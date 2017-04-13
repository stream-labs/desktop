<template>
<div
  class="StudioEditorDisplay"
  ref="display"/>
</template>

<script>
// This vue component simply manages an empty div that
// the OBS display will be drawn on top of.

import _ from 'lodash';
import Obs from '../api/Obs.js';
const { webFrame, screen, remote } = window.require('electron')

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
    }
  }

};
</script>

<style scoped>
.StudioEditorDisplay {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
