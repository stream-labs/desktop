<template>

<div class="volmeter">
  <div class="volmeter-level" ref="level"></div>
  <div class="volmeter-peak" ref="peak"></div>
</div>

</template>

<script lang="ts" src="./MixerVolmeter.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.volmeter {
  position: relative;
  overflow: hidden;
  margin: 10px 0;
  height: 4px;
  border-radius: 4px;
  background-color: @slider-background-color;

  .volmeter-level {
    .absolute(0, auto, 0, 0);
    width: 100%;
    background-color: @teal;
    transition-property: transform;
    transition-duration: 100ms;
    transition-timing-function: linear;
    transform-origin: left center;
  }

  .volmeter-peak {
    .absolute(0, auto, 0, 0);
    width: 2px;
    background-color: @input-border-color;
    transition-property: left;
    transition-duration: 100ms;
    transition-timing-function: linear;
  }
}

.night-theme {
  .volmeter {
    background-color: @night-slider-bg;
  }
}
</style>
