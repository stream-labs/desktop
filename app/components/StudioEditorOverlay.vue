<template>
<canvas
  class="StudioEditorOverlay"
  ref="canvas"
  :width="width"
  :height="height"
  @mousedown="startDragging"
  @mousemove="move"
  @mouseup="stopDragging"
  @mouseleave="stopDragging"/>
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
    },

    drawPositionLines() {
      // Midpoints in video space
      let source = this.activeSource;

      let vMid = source.y + source.height / 2;
      let hMid = source.x + source.width / 2;

      let length;

      this.drawLine(0, vMid, source.x, vMid);
      this.drawMeasurement(source.x, source.x / 2, vMid, 5, 0);

      this.drawLine(hMid, 0, hMid, source.y);
      this.drawMeasurement(source.y, hMid, source.y / 2, 20, 15);

      this.drawLine(source.x + source.width, vMid, this.videoWidth, vMid);
      length = this.videoWidth - (source.x + source.width);
      this.drawMeasurement(length, this.videoWidth - length / 2, vMid, 5, 0);

      this.drawLine(hMid, source.y + source.height, hMid, this.videoHeight);
      length = this.videoHeight - (source.y + source.height);
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
        this.convertToRenderedSpace(this.activeSource.width),
        this.convertToRenderedSpace(this.activeSource.height)
      );
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
      let srcwr = this.convertToRenderedSpace(source.width);
      let srchr = this.convertToRenderedSpace(source.height);

      if (event.offsetX < srcxr) {
        return false;
      }

      if (event.offsetX > srcxr + srcwr) {
        return false;
      }

      if (event.offsetY < srcyr) {
        return false;
      }

      if (event.offsetY > srcyr + srchr) {
        return false;
      }

      return true;
    },

    startDragging(e) {
      // If the click was not over the active source, we need to
      // see if they are trying to select another source
      if (!this.isOverSource(e, this.activeSource)) {
        let overSource = _.find(this.sources, source => {
          return this.isOverSource(e, source);
        });

        if (overSource) {
          this.$store.dispatch({
            type: 'makeSourceActive',
            sceneName: this.$store.getters.activeSceneName,
            sourceId: overSource.id
          });
        } else {
          // TODO: deselect source (it's unclear whether slobs should allow this)
          return;
        }
      }

      this.dragging = true;
      this.startX = e.pageX;
      this.startY = e.pageY;

      this.updateCursor(e);
    },

    move(e) {
      if (this.dragging) {
        let deltaX = e.pageX - this.startX;
        let deltaY = e.pageY - this.startY;

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
      }

      this.updateCursor(e);
    },

    stopDragging(e) {
      this.dragging = false;

      this.updateCursor(e);
    },

    updateCursor(e) {
      if (this.dragging) {
        this.ctx.canvas.style.cursor = '-webkit-grabbing';
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
