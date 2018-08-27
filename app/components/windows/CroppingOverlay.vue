<template>
<div
  class="container"
  :class="{ 'is-cropping': isCropping }"
  @mousedown="handleMouseDown"
  @mousemove="handleMouseMove"
  @mouseup="handleMouseUp"
>
  <div class="message">
    {{ $t('sources.selectCroppingArea') }}<br />
    {{ $t('sources.pressEscapeToCancel') }}
  </div>
  <div
    v-if="isCropping"
    class="cropping-area"
    :style="croppingAreaStyle"
  ></div>
</div>
</template>

<script lang="ts" src="./CroppingOverlay.vue.ts"></script>

<style lang="less">
body {
  background-color: rgba(255, 255, 255, 0.4);
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>

<style lang="less" scoped>
.container {
  position: relative;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
}

.message {
  color: #fff;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 64px;
}

.cropping-area {
  position: absolute;
  pointer-events: none;
  border: 3px solid rgb(255, 105, 82);
}
</style>
