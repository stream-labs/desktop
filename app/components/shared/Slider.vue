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
}

.slider-input {
  .margin-left(3);
  width: 60px;
}

.slider {
  background: transparent;
  padding: 8px 0 0 !important;
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
  background-color: @slider-background-color !important;
}

.vue-slider-process {
  background-color: @slider-progress-color !important;
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
    background-color: @slider-progress-color;
  }
}

.vue-slider-tooltip {
  background-color: transparent !important;
  border: none !important;
  color: @grey !important;
  font-size: 13px !important;
  top: 40px !important;
  .transition;

  &:before {
    display: none;
  }
}

.night-theme {
  .vue-slider {
    background-color: @night-slider-bg!important;
  }

  .slider {
    &:hover {
      .vue-slider-tooltip {
        color: @white !important;
      }
    }
  }
}
</style>
