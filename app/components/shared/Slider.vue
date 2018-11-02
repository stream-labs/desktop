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

  &:hover {
    .vue-slider-tooltip {
      color: @navy !important;
    }
  }
}

.vue-slider {
  background-color: @bg-secondary !important;

  .muted & {
    background-color: darken(@bg-secondary, 10%) !important;
  }
}

.vue-slider-process {
  background-color: @text-secondary !important;

  .muted & {
    background-color: darken(@text-secondary, 40%) !important;
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
    background-color: @text-secondary;
  }
}

.vue-slider-tooltip {
  background-color: transparent !important;
  border: none !important;
  color: @white !important;
  font-size: 13px !important;
  top: 40px !important;
  .transition;

  &:before {
    display: none;
  }
}


</style>
