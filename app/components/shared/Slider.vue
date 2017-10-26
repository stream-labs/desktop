<template>
  <vue-slider class="Slider"
    @input="value => updateValue(value)"
    :value="value"
    :disabled="disabled"
    :max="max"
    :min="min"
    :interval="interval"
    :speed="0"
    :height="4"
    :tooltip="false"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import vueSlider from 'vue-slider-component';
import { throttle } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';

@Component({
  components: { vueSlider }
})
export default class SliderInput extends Vue {

  @Prop()
  value: number;

  @Prop()
  min: number;

  @Prop()
  max: number;

  @Prop()
  interval: number;

  @Prop()
  disabled: boolean;

  @throttle(100)
  updateValue(value: number) {
    this.$emit('input', value);
  }
}
</script>

<style lang="less">

  @import "../../styles/index";

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
  .night-theme {
    .vue-slider {
      background-color: @night-slider-bg!important;
    }
  }

</style>
