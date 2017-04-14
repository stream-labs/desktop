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

      this.$store.dispatch('updateDisplayOutputRegion');
    },

    /*****************
    * Mouse Handling *
    *****************/

    handleMouseDown(event) {
      if (this.activeSource && this.isOverSource(event, this.activeSource)) {
        this.dragging = true;
        this.currentX = event.pageX;
        this.currentY = event.pageY;

        return;
      }

      const overSource = _.find(this.sources, source => {
        return this.isOverSource(event, source);
      });

      if (overSource) {
        // Make this source active
        this.$store.dispatch({
          type: 'makeSourceActive',
          sceneName: this.$store.getters.activeSceneName,
          sourceId: overSource.id
        });

        // Start dragging it
        this.dragging = true;
        this.currentX = event.pageX;
        this.currentY = event.pageY;
      } else {
        // Deselect all sources
        this.$store.dispatch({
          type: 'makeSourceActive',
          sceneName: this.$store.getters.activeSceneName,
          sourceId: null
        });
      }
    },

    handleMouseUp(event) {
      this.dragging = false;

      this.updateCursor(event);
    },

    handleMouseMove(event) {
      console.log('X', event.offsetX);
      console.log('Y', event.offsetY);

      const deltaX = event.pageX - this.currentX;
      const deltaY = event.pageY - this.currentY;
      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

      if (this.dragging) {
        if (deltaX || deltaY) {
          const converted = this.convertScalarToBaseSpace(
            deltaX * factor,
            deltaY * factor
          );

          this.$store.dispatch({
            type: 'setSourcePosition',
            sourceId: this.activeSource.id,
            x: this.activeSource.x + converted.x,
            y: this.activeSource.y + converted.y
          });

          this.currentX = event.pageX;
          this.currentY = event.pageY;
        }
      }

      this.updateCursor(event);
    },

    updateCursor(event) {
      if (this.dragging) {
        this.$refs.display.style.cursor = '-webkit-grabbing';
      } else {
        const overSource = _.find(this.sources, source => {
          return this.isOverSource(event, source);
        });

        if (overSource) {
          this.$refs.display.style.cursor = '-webkit-grab';
        } else {
          this.$refs.display.style.cursor = 'default';
        }
      }
    },

    // Takes the given mouse event, and determines if it is
    // over the given box in base resolution space.
    isOverBox(event, x, y, width, height) {
      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;

      const mouse = this.convertVectorToBaseSpace(
        event.offsetX * factor,
        event.offsetY * factor
      );

      console.log('convertedX', mouse.x, x);
      console.log('convertedY', mouse.y, y);

      if (mouse.x < x) {
        return false;
      }

      if (mouse.y < y) {
        return false;
      }

      if (mouse.x > x + width) {
        return false;
      }

      if (mouse.y > y + height) {
        return false;
      }

      return true;
    },

    // Determines if the given mouse event is over the
    // given source
    isOverSource(event, source) {
      return this.isOverBox(
        event,
        source.x,
        source.y,
        source.width,
        source.height
      );
    },

    // Size (width & height) is a scalar value, and
    // only needs to be scaled when converting between
    // spaces.
    convertScalarToBaseSpace(x, y) {
      return {
        x: x * this.baseWidth / this.renderedWidth,
        y: y * this.baseHeight / this.renderedHeight
      };
    },

    // Position is a vector value. When converting between
    // spaces, we have to add positional offsets.
    convertVectorToBaseSpace(x, y) {
      const movedX = x - this.renderedOffsetX;
      const movedY = y - this.renderedOffsetY;

      return this.convertScalarToBaseSpace(movedX, movedY);
    }
  },

  computed: {
    activeSource() {
      return this.$store.getters.activeSource;
    },

    sources() {
      if (this.$store.getters.activeScene) {
        return _.map(this.$store.getters.activeScene.sources, sourceId => {
          return this.$store.state.sources.sources[sourceId];
        });
      }
    },

    baseWidth() {
      return this.$store.state.video.width;
    },

    baseHeight() {
      return this.$store.state.video.height;
    },

    renderedWidth() {
      return this.$store.state.video.displayOutputRegion.width;
    },

    renderedHeight() {
      return this.$store.state.video.displayOutputRegion.height;
    },

    renderedOffsetX() {
      return this.$store.state.video.displayOutputRegion.x;
    },

    renderedOffsetY() {
      return this.$store.state.video.displayOutputRegion.y;
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
