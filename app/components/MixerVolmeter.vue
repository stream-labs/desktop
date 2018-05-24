<template>
<canvas class="volmeter" ref="canvas" />
</template>

<script lang="ts" src="./MixerVolmeter.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.volmeter {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin: 10px 0;
  height: 4px;
  border-radius: 4px;
  background-color: @slider-background-color;
}

.night-theme {
  .volmeter {
    background-color: @night-slider-bg;
  }
}
</style>
