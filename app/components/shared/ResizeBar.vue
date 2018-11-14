<template>
<div class="resize-bar" :class="{
 top: position === 'top',
 right: position === 'right',
 left: position === 'left',
 active: active
 }"
 :style="{transform: transform}"
 @mousedown="onMouseDownHandler"
>
</div>
</template>

<script lang="ts" src="./ResizeBar.vue.ts"></script>

<style lang="less">
@import "../../styles/index";
.resize-bar {
  position: absolute;
  background-color: rgba(50, 50, 50, 0);

  &.top {
    .absolute(0, 0, auto, 0);
    height: 10px;
    cursor: row-resize;
  }

  &.right {
    .absolute(0, 0, 0);
    width: 10px;
    margin-right: -5px;
    cursor: col-resize;
  }

  &.left {
    .absolute(0, auto, 0, 0);
    width: 10px;
    margin-left: -5px;
    cursor: col-resize;
  }


  &.active {
    background-color: rgba(50, 50, 50, 0.5);
    cursor: default;
  }
}
</style>
