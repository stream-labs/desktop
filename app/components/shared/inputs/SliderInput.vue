<template>
<div class="w-form-group__wrapper slider-container">
  <vue-slider class="slider w-form-group__input"
    :value="value"
    @input="value => updateValue(value)"
    :max="options.max"
    :min="options.min"
    :interval="options.interval"
    :speed="0"
    :height="4"
    :formatter="formatter"
    :piecewise="!!options.interval"
    ref="slider"
    :piecewiseStyle="{
        position: 'absolute',
        'backgroundColor': nightMode ? '#253239' : '#eaecee',
        height: '2px',
        width: '2px',
        'borderRadius': '1px',
        top: '12px'
    }"
    :piecewiseActiveStyle="{ backgroundColor: '#3c4c53' }"
  />
  <input
    v-if="options.hasValueBox && !options.usePercentages"
    class="slider-input"
    type="text"
    :value="value"
    @change="updateValue(parseFloat($event.target.value))"
    @keydown="handleKeydown"
  />
</div>
</template>

<script lang="ts" src="./SliderInput.vue.ts"></script>

<style lang="less">
@import "../../../styles/index";

.slider-container {
  width: 100%;
  display: flex;
  position: relative;
  .padding-bottom(2);
}

.slider-input {
  .margin-left(3);
  width: 60px;
}

.slider {
  background: transparent;
  padding: 8px 0 !important;
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

.vue-slider-piecewise {
  .vue-slider-piecewise-dot {
    display: none!important;
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
