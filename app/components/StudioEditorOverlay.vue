<template>
<canvas
  width="1920"
  height="1080"
  class="StudioEditorOverlay"
  ref="canvas"/>
</template>

<script>

drawBox = (ctx, x, y, width, height) => {
  ctx.stokeStyle = 'red';
  ctx.strokeRect(x, y, width, height);
};

export default {

  methods: {

  },

  props: ['sources']

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

  background-color: black;
}
</style>
