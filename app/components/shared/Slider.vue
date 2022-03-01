<template>
<div class="slider-container">
  <vue-slider class="slider"
    @input="value => updateValue(value)"
    :value="value"
    :disabled="disabled"
    :max="max"
    :min="min"
    :interval="interval"
    :speed="0"
    :height="4"
    :dotSize="dotSize"
    :tooltip="tooltip"
    tooltip-dir="bottom"
    :sliderStyle="sliderStyle"
    :formatter="formatter"
    ref="slider"
  />
  <input
    v-if="valueBox && !usePercentages"
    class="slider-input"
    type="text"
    :value="value"
    @change="updateValue(parseFloat($event.target.value))"
    @keydown="handleKeydown"
  />
</div>
</template>

<script lang="ts" src="./Slider.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.slider-container {
  width: 100%;
  display: flex;
  >.slider {
    width: 70% !important;
  }
  >.controls {
    width: 29.9% !important;
  }
}

.slider-input {
  margin-left: 10px;
  width: 60px;
}

.slider {
  background: transparent;
  padding:8px 0 !important;
  margin: 0;
  flex-grow: 1;
  height: auto;
}

.vue-slider {
  background-color: var(--color-border-light) !important;
}

.vue-slider-process {
  background-color: var(--color-text) !important;

  .muted & {
    opacity: @opacity-disabled;
  }
}

.vue-slider-dot {
  &:after {
    content: '';
    display: block;
    position: absolute;
    left: 5px;
    top: 5px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: var(--color-text-dark);
  }
}

.vue-slider-tooltip {
  background-color: var(--color-tooltip-bg) !important;
  border-radius: 4px !important;
  border: 1px solid var(--color-tooltip-border) !important;
  color: var(--color-tooltip-text) !important;
  font-size: @font-size4 !important;
  top: 40px !important;
  .transition;
  .shadow;

  &:before {
    display: none;
  }
}

.vue-slider-disabled {
  opacity: 0.26 !important;

  .vue-slider-tooltip-wrap {
    display: none !important;
  }
}


</style>
