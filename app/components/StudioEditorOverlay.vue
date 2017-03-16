<template>
<canvas
  class="StudioEditorOverlay"
  ref="canvas"
  :width="width"
  :height="height"
  @mousedown="handleMousedown"
  @mousemove="handleMousemove"
  @mouseup="handleMouseup"
  @mouseleave="handleMouseup"/>
</template>

<script>
import _ from 'lodash';

export default {

  data() {
    return {
      // This is how pany pixels larger the overlay is on each edge
      // compared to the original source.  This is so that we can
      // draw overlay elements that go a bit outside the video frame.
      gutterSize: 10
    }
  },

  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d');
    this.drawOverlay();

    this.$store.watch((state, getters) => {
      if (this.activeSource) {
        return {
          x: getters.activeSource.x,
          y: getters.activeSource.y,
          width: getters.activeSource.scaledWidth,
          height: getters.activeSource.scaledHeight,
          renderedWidth: state.video.renderedWidth,
          renderedHeight: state.video.renderedHeight
        };
      }
    }, () => {
      this.drawOverlay();
    });
  },

  methods: {
    drawOverlay() {
      this.ctx.canvas.width = this.width;
      this.ctx.canvas.height = this.height;
      this.ctx.clearRect(0, 0, this.width, this.height);

      if (this.activeSource) {
        this.drawPositionLines();
        this.drawSourceBorder();
        this.drawResizeBoxes();
      }
    },

    drawPositionLines() {
      // Midpoints in video space
      let source = this.activeSource;

      let vMid = source.y + source.scaledHeight / 2;
      let hMid = source.x + source.scaledWidth / 2;

      let length;

      this.drawLine(0, vMid, source.x, vMid);
      this.drawMeasurement(source.x, source.x / 2, vMid, 5, 0);

      this.drawLine(hMid, 0, hMid, source.y);
      this.drawMeasurement(source.y, hMid, source.y / 2, 20, 15);

      this.drawLine(source.x + source.scaledWidth, vMid, this.videoWidth, vMid);
      length = this.videoWidth - (source.x + source.scaledWidth);
      this.drawMeasurement(length, this.videoWidth - length / 2, vMid, 5, 0);

      this.drawLine(hMid, source.y + source.scaledHeight, hMid, this.videoHeight);
      length = this.videoHeight - (source.y + source.scaledHeight);
      this.drawMeasurement(length, hMid, this.videoHeight - length / 2, 20, 15);
    },

    // x0, y0, x1, and y1 are in video space
    drawLine(x0, y0, x1, y1) {
      let x0r = this.convertToRenderedSpace(x0) + this.gutterSize;
      let y0r = this.convertToRenderedSpace(y0) + this.gutterSize;
      let x1r = this.convertToRenderedSpace(x1) + this.gutterSize;
      let y1r = this.convertToRenderedSpace(y1) + this.gutterSize;

      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x0r, y0r);
      this.ctx.lineTo(x1r, y1r);
      this.ctx.stroke();
    },

    drawMeasurement(length, x, y, hOffset, vOffset) {
      // Convert to rendered space
      let lr = this.convertToRenderedSpace(length);
      let xr = this.convertToRenderedSpace(x) + hOffset;
      let yr = this.convertToRenderedSpace(y) + vOffset;

      // There isn't enough space to display a measurement
      // shorter than about 20 pixels
      if (lr > 20) {
        this.ctx.strokeStyle = 'red';
        this.ctx.strokeText(Math.floor(length), xr, yr)
      }
    },

    drawSourceBorder() {
      this.ctx.strokeStyle = '#333333';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(
        this.convertToRenderedSpace(this.activeSource.x) + this.gutterSize,
        this.convertToRenderedSpace(this.activeSource.y) + this.gutterSize,
        this.convertToRenderedSpace(this.activeSource.scaledWidth),
        this.convertToRenderedSpace(this.activeSource.scaledHeight)
      );
    },

    drawResizeBoxes() {
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 1;

      _.each(this.resizeRegions, region => {
        this.ctx.strokeRect(
          region.x,
          region.y,
          region.width,
          region.height
        );
      });
    },

    convertToRenderedSpace(val) {
      return val * (this.$store.state.video.renderedWidth / this.videoWidth);
    },

    convertToVideoSpace(val) {
      return val * (this.videoWidth / this.$store.state.video.renderedWidth);
    },

    // Determines if the given mouse event is over the given source
    isOverSource(event, source) {
      // Source coordinates in rendered space
      let srcxr = this.convertToRenderedSpace(source.x) + this.gutterSize;
      let srcyr = this.convertToRenderedSpace(source.y) + this.gutterSize;

      // Source dimensions in rendered space
      let srcwr = this.convertToRenderedSpace(source.scaledWidth);
      let srchr = this.convertToRenderedSpace(source.scaledHeight);

      return this.isOverBox(event, srcxr, srcyr, srcwr, srchr);
    },

    // Determines if the given mouse event is over the
    // given box in rendered space.
    isOverBox(event, x, y, width, height) {
      if (event.offsetX < x) {
        return false;
      }

      if (event.offsetX > x + width) {
        return false;
      }

      if (event.offsetY < y) {
        return false;
      }

      if (event.offsetY > y + height) {
        return false;
      }

      return true;
    },

    // Determines if the given mouse event is over a resize
    // region for the active source
    isOverResize(event) {
      return _.find(this.resizeRegions, region => {
        return this.isOverBox(
          event,
          region.x,
          region.y,
          region.width,
          region.height
        );
      });
    },

    // Performs an aspect-ratio-locked resize on the source.
    // The move arguments determine whether the x and y position
    // should be moved to compensate for the scaling.  This is
    // useful for scaling relative to a certain origin point.
    resize(pixelsX, pixelsY, moveX, moveY) {
      let pixelsxv = this.convertToVideoSpace(pixelsX);
      let pixelsyv = this.convertToVideoSpace(pixelsY);

      let deltaScaleX = pixelsxv / this.activeSource.width;
      let deltaScaleY = pixelsyv / this.activeSource.height;

      // Take the bigger of the 2 scales, to preserve aspect ratio
      if (Math.abs(deltaScaleX) > Math.abs(deltaScaleY)) {
        deltaScaleY = deltaScaleX;
        pixelsyv = pixelsxv * (this.activeSource.height / this.activeSource.width);
      } else {
        deltaScaleX = deltaScaleY;
        pixelsxv = pixelsyv * (this.activeSource.width / this.activeSource.height);
      }

      this.$store.dispatch({
        type: 'setSourceScale',
        sourceId: this.activeSource.id,
        scaleX: this.activeSource.scaleX + deltaScaleX,
        scaleY: this.activeSource.scaleY + deltaScaleY
      });

      if (moveX || moveY) {
        this.$store.dispatch({
          type: 'setSourcePosition',
          sourceId: this.activeSource.id,
          x: this.activeSource.x - (moveX && pixelsxv || 0),
          y: this.activeSource.y - (moveY && pixelsyv || 0)
        });
      }
    },

    handleMousedown(e) {
      /* Click Priority:
       * 1. If over a resize region, start resizing
       * 2. If over the active source, start dragging it
       *    regardless of whether it is on top
       * 3. If over another source, find the one on top, make
       *    it active, and start dragging it
       * 4. Otherwise, deselect the currently active source
       */

      if (this.activeSource) {
        let overResize = this.isOverResize(e);

        if (overResize) {
          // Start resizing
          this.resizeRegion = overResize;
          this.currentX = e.pageX;
          this.currentY = e.pageY;

          return;
        } else if (this.isOverSource(e, this.activeSource)) {
          // Start dragging the active source
          this.dragging = true;
          this.currentX = e.pageX;
          this.currentY = e.pageY;

          return;
        }
      }

      let overSource = _.find(this.sources, source => {
        return this.isOverSource(e, source);
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
        this.currentX = e.pageX;
        this.currentY = e.pageY;
      } else {
        this.$store.dispatch({
          type: 'makeSourceActive',
          sceneName: this.$store.getters.activeSceneName,
          // null sourceId means no active source
          sourceId: null
        });
      }

      // This might have changed the cursor
      this.updateCursor(e);
    },

    handleMousemove(e) {
      let deltaX = e.pageX - this.currentX;
      let deltaY = e.pageY - this.currentY;

      if (this.resizeRegion) {
        if (deltaX || deltaY) {
          let name = this.resizeRegion.name;

          if (name === 'nw') {
            this.resize(-1 * deltaX, -1 * deltaY, true, true);
          } else if (name === 'sw') {
            this.resize(-1 * deltaX, deltaY, true, false);
          } else if (name === 'ne') {
            this.resize(deltaX, -1 * deltaY, false, true);
          } else if (name === 'se') {
            this.resize(deltaX, deltaY, false, false);
          } else if (name === 'n') {
            this.resize(0, -1 * deltaY, false, true);
          } else if (name === 's') {
            this.resize(0, deltaY, false, false);
          } else if (name === 'e') {
            this.resize(deltaX, 0, false, false);
          } else if (name === 'w') {
            this.resize(-1 * deltaX, 0, true, false);
          }

          this.currentX = e.pageX;
          this.currentY = e.pageY;
        }
      } else if (this.dragging) {

        if (deltaX || deltaY) {
          this.$store.dispatch({
            type: 'setSourcePosition',
            sourceId: this.activeSource.id,
            x: this.activeSource.x + this.convertToVideoSpace(deltaX),
            y: this.activeSource.y + this.convertToVideoSpace(deltaY)
          });

          this.currentX = e.pageX;
          this.currentY = e.pageY;
        }
      } else {
        this.updateCursor(e);
      }
    },

    handleMouseup(e) {
      this.dragging = false;
      this.resizeRegion = null;

      this.updateCursor(e);
    },

    updateCursor(e) {
      if (this.dragging) {
        this.ctx.canvas.style.cursor = '-webkit-grabbing';
      } else {
        let overResize = this.isOverResize(e);

        if (overResize) {
          this.ctx.canvas.style.cursor = overResize.cursor;
        } else {
          let overSource = _.find(this.sources, source => {
            return this.isOverSource(e, source);
          });

          if (overSource) {
            this.ctx.canvas.style.cursor = '-webkit-grab';
          } else {
            this.ctx.canvas.style.cursor = 'default';
          }
        }
      }
    }
  },

  computed: {
    activeSource() {
      return this.$store.getters.activeSource;
    },

    videoWidth() {
      return this.$store.state.video.width;
    },

    videoHeight() {
      return this.$store.state.video.height;
    },

    width() {
      return this.$store.state.video.renderedWidth + this.gutterSize * 2;
    },

    height() {
      return this.$store.state.video.renderedHeight + this.gutterSize * 2;
    },

    sources() {
      return _.map(this.$store.getters.activeScene.sources, sourceId => {
        return this.$store.state.sources.sources[sourceId];
      });
    },

    resizeRegions() {
      if (!this.activeSource) {
        return [];
      }

      let source = this.activeSource;

      const regionRadius = 5;

      const width = regionRadius * 2;
      const height = regionRadius * 2;

      // Compass coordinates
      return [
        {
          name: 'nw',
          x: this.convertToRenderedSpace(source.x) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'nwse-resize'
        },
        {
          name: 'sw',
          x: this.convertToRenderedSpace(source.x) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y + source.scaledHeight) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'nesw-resize'
        },
        {
          name: 'ne',
          x: this.convertToRenderedSpace(source.x + source.scaledWidth) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'nesw-resize'
        },
        {
          name: 'se',
          x: this.convertToRenderedSpace(source.x + source.scaledWidth) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y + source.scaledHeight) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'nwse-resize'
        },
        {
          name: 'n',
          x: this.convertToRenderedSpace(source.x + source.scaledWidth / 2) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'ns-resize'
        },
        {
          name: 's',
          x: this.convertToRenderedSpace(source.x + source.scaledWidth / 2) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y + source.scaledHeight) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'ns-resize'
        },
        {
          name: 'e',
          x: this.convertToRenderedSpace(source.x + source.scaledWidth) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y + source.scaledHeight / 2) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'ew-resize'
        },
        {
          name: 'w',
          x: this.convertToRenderedSpace(source.x) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y + source.scaledHeight / 2) + this.gutterSize - regionRadius,
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
.StudioEditorOverlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;

  z-index: 1000;
}
</style>
