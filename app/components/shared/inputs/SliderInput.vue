<template>
  <div
    class="w-form-group__wrapper slider-container"
    :class="[options.displayValue === 'false' ? '' : 'has-tooltip']"
    data-role="input"
    data-type="slider"
    :data-name="options.name"
  >
    <slider
      :value="localValue"
      @input="value => updateLocalValue(value)"
      :max="max"
      :min="min"
      :interval="interval"
      :tooltip="options.displayValue || 'always'"
      :speed="0"
      :suffix="usePercentages ? '%' : ''"
      :data="options.data"
      :simpleTheme="options.simpleTheme"
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

<style lang="less" scoped>
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
  margin-left: 16px;
  position: relative;
  top: -8px;
}
</style>
