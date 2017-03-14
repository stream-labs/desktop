<template>
<canvas
  class="StudioEditorOverlay"
  ref="canvas"
  :width="width"
  :height="height"
  @mousedown="startDragging"
  @mousemove="move"
  @mouseup="stopDragging"/>
</template>

<script>

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
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        this.convertToRenderedSpace(this.activeSource.x) + this.gutterSize,
        this.convertToRenderedSpace(this.activeSource.y) + this.gutterSize,
        this.convertToRenderedSpace(this.activeSource.width),
        this.convertToRenderedSpace(this.activeSource.height)
      );
    },

    convertToRenderedSpace(val) {
      return val * (this.$store.state.video.renderedWidth / this.$store.state.video.width);
    },

    convertToVideoSpace(val) {
      return val * (this.$store.state.video.width / this.$store.state.video.renderedWidth);
    },

    startDragging(e) {
      console.log("STARTING DRAG");
      this.dragging = true;
      this.startX = e.pageX;
      this.startY = e.pageY;
    },

    move(e) {
      console.log("MOVING");
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
    },

    stopDragging() {
      console.log("STOPPING DRAG");
      this.dragging = false;
    }
  },

  computed: {
    activeSource() {
      return this.$store.getters.activeSource;
    },

    width() {
      return this.$store.state.video.renderedWidth + this.gutterSize * 2;
    },

    height() {
      return this.$store.state.video.renderedHeight + this.gutterSize * 2;
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
