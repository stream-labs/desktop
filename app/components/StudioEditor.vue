<template>
<div
  class="StudioEditor-display"
  ref="display"
  @mousedown="handleMouseDown"
  @mouseup="handleMouseUp"
  @mousemove="handleMouseMove"
  @mouseenter="handleMouseEnter"/>
</template>

<script>
import _ from 'lodash';
import Obs from '../api/Obs';
import DragHandler from '../util/DragHandler';

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

      this.$store.dispatch('updateDisplayOutputRegion');
    },

    /*****************
    * Mouse Handling *
    *****************/

    handleMouseDown(event) {
      if (this.activeSource) {
        const overResize = this.isOverResize(event);

        if (overResize) {
          this.startResizing(event, overResize);
          return;
        }

        if (this.isOverSource(event, this.activeSource)) {
          this.startDragging(event);
          return;
        }
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
        this.startDragging(event);
      } else {
        // Deselect all sources
        this.$store.dispatch({
          type: 'makeSourceActive',
          sceneName: this.$store.getters.activeSceneName,
          sourceId: null
        });
      }

      this.updateCursor(event);
    },

    startDragging(event) {
      this.dragHandler = new DragHandler(event);
    },

    startResizing(event, region) {
      this.resizeRegion = region;
      this.currentX = event.pageX;
      this.currentY = event.pageY;
    },

    handleMouseUp(event) {
      this.dragHandler = null;
      this.resizeRegion = null;

      this.updateCursor(event);
    },

    handleMouseEnter(event) {
      if (event.buttons !== 1) {
        this.dragHandler = null;
        this.resizeRegion = null;
      }
    },

    handleMouseMove(event) {
      const deltaX = event.pageX - this.currentX;
      const deltaY = event.pageY - this.currentY;
      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;
      const converted = this.convertScalarToBaseSpace(
        deltaX * factor,
        deltaY * factor
      );

      if (this.resizeRegion) {
        if (deltaX || deltaY) {
          const name = this.resizeRegion.name;

          if (name === 'nw') {
            this.resize(-1 * converted.x, -1 * converted.y, true, true);
          } else if (name === 'sw') {
            this.resize(-1 * converted.x, converted.y, true, false);
          } else if (name === 'ne') {
            this.resize(converted.x, -1 * converted.y, false, true);
          } else if (name === 'se') {
            this.resize(converted.x, converted.y, false, false);
          } else if (name === 'n') {
            this.resize(0, -1 * converted.y, false, true);
          } else if (name === 's') {
            this.resize(0, converted.y, false, false);
          } else if (name === 'e') {
            this.resize(converted.x, 0, false, false);
          } else if (name === 'w') {
            this.resize(-1 * converted.x, 0, true, false);
          }

          this.currentX = event.pageX;
          this.currentY = event.pageY;
        }
      } else if (this.dragHandler) {
        this.dragHandler.move(event);
      }

      this.updateCursor(event);
    },

    // Performs an aspect ratio locked resize on the active source.
    // The move arguments determine whether the x and y position
    // should be moved to compensate for the scaling. This is
    // useful for scaling relative to a certain origin point.
    resize(x, y, moveX, moveY) {
      const source = this.activeSource;

      let pixelsX = x;
      let pixelsY = y;
      let deltaScaleX = pixelsX / source.width;
      let deltaScaleY = pixelsY / source.height;

      // Take the bigger of the 2 scales, to preserve aspect ratio
      if (Math.abs(deltaScaleX) > Math.abs(deltaScaleY)) {
        deltaScaleY = deltaScaleX;
        pixelsY = pixelsX * (source.height / source.width);
      } else {
        deltaScaleX = deltaScaleY;
        pixelsX = pixelsY * (source.width / source.height);
      }

      let clamped = false;
      const newScaleX = source.scaleX + deltaScaleX;
      const newScaleY = source.scaleY + deltaScaleY;

      if (newScaleX < 0 ) {
        newScaleX = 0;
        clamped = true;
      }

      if (newScaleY < 0) {
        newScaleY = 0;
        clamped = true;
      }

      this.$store.dispatch({
        type: 'setSourcePositionAndScale',
        sourceId: source.id,
        x: source.x - ((!clamped && moveX && pixelsX) || 0),
        y: source.y - ((!clamped && moveY && pixelsY) || 0),
        scaleX: newScaleX,
        scaleY: newScaleY
      });
    },

    updateCursor(event) {
      if (this.dragHandler) {
        this.$refs.display.style.cursor = '-webkit-grabbing';
      } else if (this.resizeRegion) {
        this.$refs.display.style.cursor = this.resizeRegion.cursor;
      } else {
        const overResize = this.isOverResize(event);

        if (overResize) {
          this.$refs.display.style.cursor = overResize.cursor;
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
        source.width * source.scaleX,
        source.height * source.scaleY
      );
    },

    // Determines if the given mouse event is over any
    // of the active source's resize regions.
    isOverResize(event) {
      if (this.activeSource) {
        return _.find(this.resizeRegions, region => {
          return this.isOverBox(event, region.x, region.y, region.width, region.height);
        });
      }

      return null;
    },

    // Size (width & height) is a scalar value, and
    // only needs to be scaled when converting between
    // spaces.
    convertScalarToBaseSpace(x, y) {
      return {
        x: (x * this.baseWidth) / this.renderedWidth,
        y: (y * this.baseHeight) / this.renderedHeight
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
      const activeSource = this.$store.getters.activeSource;

      if (activeSource && activeSource.video) {
        return activeSource;
      }

      return null;
    },

    sources() {
      if (this.$store.getters.activeScene) {
        return _.map(this.$store.getters.activeScene.sources, sourceId => {
          return this.$store.state.sources.sources[sourceId];
        }).filter(source => {
          // We only care about sources with video
          return source.video;
        });
      }

      return null;
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
    },

    // Using a computed property since it is cached
    resizeRegions() {
      if (!this.activeSource) {
        return [];
      }

      const source = this.activeSource;
      const renderedRegionRadius = 5;
      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;
      const regionRadius = renderedRegionRadius * factor * this.baseWidth / this.renderedWidth;
      const width = regionRadius * 2;
      const height = regionRadius * 2;

      return [
        {
          name: 'nw',
          x: source.x - regionRadius,
          y: source.y - regionRadius,
          width,
          height,
          cursor: 'nwse-resize'
        },
        {
          name: 'n',
          x: (source.x + ((source.width * source.scaleX) / 2)) - regionRadius,
          y: source.y - regionRadius,
          width,
          height,
          cursor: 'ns-resize'
        },
        {
          name: 'ne',
          x: (source.x + (source.width * source.scaleX)) - regionRadius,
          y: source.y - regionRadius,
          width,
          height,
          cursor: 'nesw-resize'
        },
        {
          name: 'e',
          x: (source.x + (source.width * source.scaleX)) - regionRadius,
          y: (source.y + ((source.height * source.scaleY) / 2)) - regionRadius,
          width,
          height,
          cursor: 'ew-resize'
        },
        {
          name: 'se',
          x: (source.x + (source.width * source.scaleX)) - regionRadius,
          y: (source.y + (source.height * source.scaleY)) - regionRadius,
          width,
          height,
          cursor: 'nwse-resize'
        },
        {
          name: 's',
          x: (source.x + ((source.width * source.scaleX) / 2)) - regionRadius,
          y: (source.y + (source.height * source.scaleY)) - regionRadius,
          width,
          height,
          cursor: 'ns-resize'
        },
        {
          name: 'sw',
          x: source.x - regionRadius,
          y: (source.y + (source.height * source.scaleY)) - regionRadius,
          width,
          height,
          cursor: 'nesw-resize'
        },
        {
          name: 'w',
          x: source.x - regionRadius,
          y: (source.y + ((source.height * source.scaleY) / 2)) - regionRadius,
          width,
          height,
          cursor: 'ew-resize'
        }
      ];
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
