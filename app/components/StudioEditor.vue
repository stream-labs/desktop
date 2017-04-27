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
      this.dragging = true;
      this.currentX = event.pageX;
      this.currentY = event.pageY;
    },

    startResizing(event, region) {
      this.resizeRegion = region;
      this.currentX = event.pageX;
      this.currentY = event.pageY;
    },

    handleMouseUp(event) {
      this.dragging = false;
      this.resizeRegion = null;

      this.updateCursor(event);
    },

    handleMouseEnter(event) {
      if (event.buttons !== 1) {
        this.dragging = false;
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
      } else if (this.dragging) {
        if (deltaX || deltaY) {
          this.drag(converted.x, converted.y);
        }
      }

      this.updateCursor(event);
    },

    // x & y are pixel distances in base space
    drag(x, y) {
      // Sensisivity is pixels in base space for now.
      // Should eventually be rendered space.
      const snapSensitivity = 20;

      // Scaled width and height
      const sourceWidth = this.activeSource.width * this.activeSource.scaleX;
      const sourceHeight = this.activeSource.height * this.activeSource.scaleY;

      // The new source location before applying snapping
      let newX = this.activeSource.x + x;
      let newY = this.activeSource.y + y;

      // Whether or not we snapped on the X or Y coordinate
      let snappedX = false;
      let snappedY = false;

      // Edge Snapping:
      // Left Edge:
      if ((newX < snapSensitivity) && (newX > snapSensitivity * -1)) {
        newX = 0;
        snappedX = true;
      }

      // Top Edge:
      if ((newY < snapSensitivity) && (newY > snapSensitivity * -1)) {
        newY = 0;
        snappedY = true;
      }

      // Right Edge:
      const rightEdgeX = newX + sourceWidth;
      const snapRightMin = this.baseWidth - snapSensitivity;
      const snapRightMax = this.baseWidth + snapSensitivity;

      if ((rightEdgeX > snapRightMin) && (rightEdgeX < snapRightMax)) {
        newX = this.baseWidth - sourceWidth;
        snappedX = true;
      }

      // Bottom Edge:
      const bottomEdgeY = newY + sourceHeight;
      const snapBottomMin = this.baseHeight - snapSensitivity;
      const snapBottomMax = this.baseHeight + snapSensitivity;

      if ((bottomEdgeY > snapBottomMin) && (bottomEdgeY < snapBottomMax)) {
        newY = this.baseHeight - sourceHeight;
        snappedY = true;
      }

      this.$store.dispatch({
        type: 'setSourcePosition',
        sourceId: this.activeSource.id,
        x: newX,
        y: newY
      });

      if (!snappedX) {
        this.currentX = event.pageX;
      }

      if (!snappedY) {
        this.currentY = event.pageY;
      }
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

      this.$store.dispatch({
        type: 'setSourcePositionAndScale',
        sourceId: source.id,
        x: source.x - ((moveX && pixelsX) || 0),
        y: source.y - ((moveY && pixelsY) || 0),
        scaleX: source.scaleX + deltaScaleX,
        scaleY: source.scaleY + deltaScaleY
      });
    },

    updateCursor(event) {
      if (this.dragging) {
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
      return this.$store.getters.activeSource;
    },

    sources() {
      if (this.$store.getters.activeScene) {
        return _.map(this.$store.getters.activeScene.sources, sourceId => {
          return this.$store.state.sources.sources[sourceId];
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
