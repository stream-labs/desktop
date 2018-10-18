<template>
<div class="volmeter-container">
  <canvas class="volmeter" ref="canvas" />
  <div class="volmeter-spacer" ref="spacer" />
</div>
</template>

<script lang="ts" src="./MixerVolmeter.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.volmeter {
  position: absolute;
  overflow: hidden;
  background-color: @slider-background-color;
}

.volmeter-spacer {
  margin: 10px 0;
}

.night-theme {
  .volmeter {
    background-color: @night-slider-bg;
  }
}
</style>
