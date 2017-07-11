<template>
  <div class="input-container">
    <div class="input-label">
      <label>{{ value.description }}</label>
    </div>
    <div class="input-wrapper">
      <div class="slider-container">
        <Slider
          @input="value => updateValue(value)"
          :value="value.value"
          :disabled="value.enabled == false"
          :max="value.maxVal"
          :min="value.minVal"
          :interval="value.stepVal"
          tooltip="always"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { throttle } from 'lodash-decorators';
  import { Component, Prop } from 'vue-property-decorator';
  import { ISliderInputValue, TObsType, Input } from './Input';
  import Slider from '../Slider.vue';

  @Component({
    components: { Slider }
  })
  class SliderInput extends Input<ISliderInputValue> {

    static obsType: TObsType;

    @Prop()
    value: ISliderInputValue;

    @throttle(100)
    updateValue(value: number) {
      this.emitInput({ ...this.value, value });
    }

  }

  SliderInput.obsType = 'OBS_PROPERTY_SLIDER';

  export default SliderInput;
</script>

<style lang="less" scoped>
@import "../../../styles/index";

.slider-container {
  height: 45px;
  position: relative;
}

.slider-label {
  position: absolute;
  bottom: 4px;
  color: @input-label-color;
  &.slider-label--left { left: 0 }
  &.slider-label--right { right: 0 }
}

.slider-value {
  position: absolute;
  top: 23px;
  right: 0;
  width: 45px;
  height: 20px;
  padding: 0 4px;
  border-radius: 2px;
  text-align: right;
  cursor: default;
  border: none;
}
</style>
