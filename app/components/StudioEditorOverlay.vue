<template>
<canvas
  width="1920"
  height="1080"
  class="StudioEditorOverlay"
  ref="canvas"
  @mousedown="startDragging"
  @mouseup="stopDragging"/>
</template>

<script>
export default {

  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d');
    this.drawOverlay();
  },

  methods: {
    drawOverlay() {
      console.log('DRAW');
      this.ctx.clearRect(0, 0, 1920, 1080);
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(
        this.activeSource.x,
        this.activeSource.y,
        this.activeSource.width,
        this.activeSource.height
      );
    },

    startDragging() {
      console.log("STARTING DRAG");
      debugger;
    },

    stopDragging() {
      console.log("STOPPING DRAG");
    }
  },

  watch: {
    activeSource() {
      this.drawOverlay();
    }
  },

  computed: {
    activeSource() {
      return this.$store.getters.activeSource;
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
  max-width: 100%;
  max-height: 100%;

  z-index: 1000;
}
</style>
