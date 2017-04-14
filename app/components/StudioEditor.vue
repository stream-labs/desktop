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
import _ from 'lodash';
const { webFrame, screen, remote } = window.require('electron');

export default {

  mounted() {
    Obs.createDisplay('Main Window');
    this.onResize();

    remote.getCurrentWindow().show();

    window.addEventListener('resize', this.onResize);

    // Ensure our positions and scales are up to date
    _.each(this.sources, source => {
      this.$store.dispatch({
        type: 'loadSourcePositionAndScale',
        sourceId: source.id
      });
    });

    // Make sure we are listening for changes in size
    this.sizeInterval = setInterval(() => {
      _.each(this.sources, source => {
        const size = Obs.getSourceSize(source.name);

        if ((source.width !== size.width) || (source.height !== size.height)) {
          this.$store.dispatch({
            type: 'setSourceSize',
            sourceId: source.id,
            width: size.width,
            height: size.height
          });
        }
      });
    }, 1000);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);

    Obs.destroyDisplay('Main Window');

    clearInterval(this.sizeInterval);
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
  },

  computed: {
    sources() {
      if (this.$store.getters.activeScene) {
        return _.map(this.$store.getters.activeScene.sources, sourceId => {
          return this.$store.state.sources.sources[sourceId];
        });
      }
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
