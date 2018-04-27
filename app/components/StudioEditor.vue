<template>
<div
  class="studio-editor-display noselect"
  ref="display"
  @mousedown="handleMouseDown"
  @mouseup="handleMouseUp"
  @mousemove="handleMouseMove"
  @mouseenter="handleMouseEnter"
  @dblclick="handleMouseDblClick"
  >
  <display
    :drawUI="true"
    :paddingSize="10"
    @outputResize="onOutputResize"/>
</div>
</template>

<script lang="ts" src="./StudioEditor.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.studio-editor-display {
  position: relative;
  flex-grow: 1;
  background-color: @navy-secondary;
}
</style>
