<template>
  <div class="input SliderInput">
    <label>{{ value.description }}</label>
    <div class="slider-container">
      <vue-slider
        @input="value => onInputHandler(value)"
        :value="value.value"
        :disabled="!value.enabled"
        :max="value.maxVal"
        :min="value.minVal"
        :interval="value.stepVal"
        :speed="0"
        :height="4"
        :tooltip="false"
      />
      <div class="slider-label slider-label-left">{{ value.minVal }}</div>
      <div class="slider-label slider-label-right">{{ value.maxVal }}</div>
    </div>
    <input type="text" readonly :value="value.value"/>
  </div>
</template>

<script lang="ts">
  import vueSlider from 'vue-slider-component';
  import { throttle } from 'lodash-decorators';
  import { Component, Prop } from 'vue-property-decorator';
  import { ISliderInputValue, TObsType, Input } from './Input';

  @Component({
    components: { vueSlider }
  })
  class SliderInput extends Input<ISliderInputValue> {

    static obsType: TObsType;

    @Prop()
    value: ISliderInputValue;

    @throttle(100)
    onInputHandler(value: number) {
      this.emitInput({ ...this.value, value });
    }
  }
  SliderInput.obsType = 'OBS_PROPERTY_SLIDER';

  export default SliderInput;
</script>

<style lang="less">

  @import "../../../styles/index";

  .SliderInput {
    position: relative;

    .slider-container {
      height: 45px;
      margin-right: 50px;
      position: relative;
    }

    .slider-label {
      position: absolute;
      bottom: 4px;
      color: @input-label-color;
      &.slider-label-left { left: 0 }
      &.slider-label-right { right: 0 }
    }

    .vue-slider {
      background-color: @slider-background-color !important;
    }

    .vue-slider-process {
      background-color: @slider-progress-color !important;
    }

    .vue-slider-dot{
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

    input {
      position: absolute;
      top: 23px;
      right: 0;
      width: 45px;
      height: 20px;
      padding: 0 4px;
      border-radius: 2px;
      text-align: right;
      cursor: default;
    }
  }

</style>
