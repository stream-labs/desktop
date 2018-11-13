<template>
<div class="resizing-bar">
  resize bar position {{ position }}
  <!--:class="{ left: position === 'left', top: position === 'top'}"-->
</div>
</template>

<script lang="ts" src="./ResizingBar.vue.ts"></script>

<style lang="less">
@import "../../styles/index";
.resizing-bar {
  position: absolute;
  background-color: rgba(50, 50, 50, 0.5);

  &.left {
    .absolute(0, auto, 0, 0);
    width: 10px;
    cursor: col-resize;
  }

  &.top {
    .absolute(0, 0, auto, 0);
    height: 10px;
    cursor: row-resize;
  }

  &.active {
    cursor: default;
  }
}
</style>
