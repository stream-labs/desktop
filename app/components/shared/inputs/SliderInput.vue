<template>
  <div
    class="w-form-group__wrapper slider-container"
    :class="[options.displayValue === 'false' ? '' : 'has-tooltip']"
    data-role="input"
    data-type="slider"
    :data-name="options.name"
  >
    <vue-slider
      class="slider w-form-group__input"
      :value="localValue"
      @input="value => updateLocalValue(value)"
      :max="options.max"
      :min="options.min"
      :interval="options.interval"
      :tooltip="options.displayValue || 'always'"
      :speed="0"
      :height="4"
      :formatter="formatter"
      :piecewise="options.piecewise || (options.interval && options.interval >= 1)"
      :piecewiseLabel="options.piecewiseLabel"
      :data="options.data"
      ref="slider"
      :piecewiseStyle="{
        position: 'absolute',
        backgroundColor: sliderColor[theme],
        height: '2px',
        width: '2px',
        'borderRadius': '1px',
        top: '12px'
    }"
      :labelStyle="{ color: sliderColor[theme]  }"
      :piecewiseActiveStyle="{ backgroundColor: '#3c4c53' }"
      :sliderStyle="options.sliderStyle"
      :dotSize="options.dotSize"
    />
    <input
      v-if="options.hasValueBox && !options.usePercentages"
      class="slider-input"
      type="text"
      :value="localValue"
      @input="updateLocalValue($event.target.value)"
      @keydown="handleKeydown"
    >
  </div>
</template>

<script lang="ts" src="./SliderInput.vue.ts"></script>

<style lang="less">
@import '../../../styles/index';

.slider-container {
  width: 100%;
  display: flex;
  position: relative;
}

.slider-container.has-tooltip {
  padding-bottom: 16px;
}

.slider-input {
  width: 50px;
}
</style>
