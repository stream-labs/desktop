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
      return {
        x: getters.activeSource.x,
        y: getters.activeSource.y,
        width: getters.activeSource.width,
        height: getters.activeSource.height,
        renderedWidth: state.video.renderedWidth,
        renderedHeight: state.video.renderedHeight
      };
    }, () => {
      this.drawOverlay();
    });
  },

  methods: {
    drawOverlay() {
      this.ctx.canvas.width = this.width;
      this.ctx.canvas.height = this.height;
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.drawPositionLines();
      this.drawSourceBorder();
      this.drawResizeBoxes();
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
      this.ctx.strokeStyle = '#222222';
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

    handleMousedown(e) {
      /* Click Priority:
       * 1. If over a resize region, start resizing
       * 2. If over the active source, start dragging it
       *    regardless of whether it is on top
       * 3. If over another source, find the one on top, make
       *    it active, and start dragging it
       */

      let overResize = this.isOverResize(e);

      if (overResize) {
        // Start resizing
        this.resizeRegion = overResize;
        this.startX = e.pageX;
        this.startY = e.pageY;
      } else if (this.isOverSource(e, this.activeSource)) {
        // Start dragging the active source
        this.dragging = true;
        this.startX = e.pageX;
        this.startY = e.pageY;
      } else {
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
          this.startX = e.pageX;
          this.startY = e.pageY;
        }
      }

      // This might have changed the cursor
      this.updateCursor(e);
    },

    handleMousemove(e) {
      let deltaX = e.pageX - this.startX;
      let deltaY = e.pageY - this.startY;

      if (this.resizeRegion) {
        if (deltaX || deltaY) {
          let dxv = this.convertToVideoSpace(deltaX);
          let dyv = this.convertToVideoSpace(deltaY);

          console.log("RESIZING");
        }
      } else if (this.dragging) {

        if (deltaX || deltaY) {
          this.$store.dispatch({
            type: 'setSourcePosition',
            sourceId: this.activeSource.id,
            x: this.activeSource.x + this.convertToVideoSpace(deltaX),
            y: this.activeSource.y + this.convertToVideoSpace(deltaY)
          });

          this.startX = e.pageX;
          this.startY = e.pageY;
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
      let source = this.activeSource;

      const regionRadius = 5;

      const width = regionRadius * 2;
      const height = regionRadius * 2;

      // Compass coordinates
      return {
        nw: {
          x: this.convertToRenderedSpace(source.x) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'nwse-resize'
        },
        sw: {
          x: this.convertToRenderedSpace(source.x) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y + source.scaledHeight) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'nesw-resize'
        },
        ne: {
          x: this.convertToRenderedSpace(source.x + source.scaledWidth) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'nesw-resize'
        },
        se: {
          x: this.convertToRenderedSpace(source.x + source.scaledWidth) + this.gutterSize - regionRadius,
          y: this.convertToRenderedSpace(source.y + source.scaledHeight) + this.gutterSize - regionRadius,
          width,
          height,
          cursor: 'nwse-resize'
        }
      };
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
