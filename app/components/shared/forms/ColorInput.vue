<template>
<div>
  <label>{{ value.description }}</label>
  <div
    class="ColorPicker-text"
    @click="togglePicker">
    <input
      class="ColorPicker-input"
      type="text"
      readonly
      :value="hexARGB">
    <div
      class="ColorPicker-swatch"
      :style="swatchStyle"/>
  </div>
  <color-picker
    v-model="color"
    v-if="pickerVisible"
    @change-color="onChange"/>
</div>
</template>

<script lang="ts">
import _ from 'lodash';
import Vue from 'vue';
import { Component, Watch, Prop } from 'vue-property-decorator';
import { debounce } from 'lodash-decorators';
import { TObsType, IInputValue } from './Input';
const VueColor = require('vue-color');

interface IColor {
  hex: string,
  a: number
}


@Component({
  components: { ColorPicker: VueColor.Sketch }
})
class ColorInput extends Vue {

  static obsType: TObsType;

  @Prop()
  value: IInputValue<string>;

  color: IColor = {
    hex: '#ffffff',
    a: 1
  };

  pickerVisible = false;


  onChange(color: IColor) {
    this.color = color;
  }


  togglePicker() {
    this.pickerVisible = !this.pickerVisible;
  }


  @debounce(500)
  setValue() {
    if ((this.color.a !== this.obsColor.a) || (this.color.hex !== this.obsColor.hex)) {
      this.$emit('input', Object.assign({}, this.value, { currentValue: this.hexRGBA }));
    }
  }


  @Watch('color')
  onColorChangeHandler() {
    this.setValue();
  }


  @Watch('obsColor')
  onObsColorChangeHandler() {
    this.color = this.obsColor;
  }

  created() {
    this.color = this.obsColor;
  }

  get hexAlpha() {
    let alpha = this.color.a;
    return _.padStart(Math.floor(alpha * 255).toString(16), 2, '0');
  }

  get hexColor() {
    return this.color.hex.substr(1);
  }

  // This is what node-obs uses
  get hexRGBA() {
    return (this.hexColor + this.hexAlpha).toLowerCase();
  }

  // This is displayed to the user
  get hexARGB() {
    return ('#' + this.hexAlpha + this.hexColor).toLowerCase();
  }

  get swatchStyle() {
    return {
      backgroundColor: this.color.hex,
      opacity: this.color.a || 1
    };
  }

  // This represents the actual value in the property in OBS
  get obsColor(): IColor {
    let obsStr = this.value.currentValue;

    return {
      hex: '#' + obsStr.substr(0, 6),
      a: parseInt(obsStr.substr(6), 16) / 255
    };
  }

}
ColorInput.obsType = 'OBS_PROPERTY_COLOR';
export default ColorInput;

</script>

<style lang="less">
.ColorPicker-text {
  position: relative;
  cursor: pointer;
}

.ColorPicker-input {
  cursor: pointer !important;
}

.ColorPicker-swatch {
  position: absolute;
  top: 8px;
  right: 8px;
  border-radius: 2px;
  border: 1px solid #ccc;

  width: 20px;
  height: 20px;
}
</style>
