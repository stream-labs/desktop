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
  <div class="resize-line" />
</div>
</template>

<script lang="ts" src="./ResizeBar.vue.ts"></script>

<style lang="less">
@import "../../styles/index";
.resize-bar {
  position: relative;
  z-index: 1001;
  background-color: rgba(50, 50, 50, 0);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &.top {
    height: 10px;
    cursor: row-resize;

    .resize-line {
      height: 1px;
      width: 100%;
    }
  }

  &.right {
    width: 10px;
    margin-right: -5px;
    cursor: col-resize;

    .resize-line {
      height: 100%;
      width: 1px;
    }
  }

  &.left {
    width: 10px;
    margin-left: -5px;
    cursor: col-resize;

    .resize-line {
      height: 100%;
      width: 1px;
    }
  }

  &.active {
    background-color: rgba(50, 50, 50, 0.5);
    cursor: default;
  }

  &:hover {
    .resize-line {
      background-color: @light-5;
    }

    .night-theme {
      .resize-line {
        background-color: @dark-5;
      }
    }
  }
}

.resize-line {
  background-color: @day-border;
}

.night-theme {
  .resize-line {
    background-color: @night-border;
  }
}
</style>
