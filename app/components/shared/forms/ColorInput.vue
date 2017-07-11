<template>
<div>
  <div class="input-container">
    <div class="input-label">
      <label>{{ value.description }}</label>
    </div>
    <div class="input-wrapper">
      <div class="colorpicker">
        <div
          class="colorpicker__text"
          @click="togglePicker">
          <input
            class="colorpicker__input"
            type="text"
            readonly
            :value="hexARGB">
          <div
            class="colorpicker__swatch"
            :style="swatchStyle"/>
        </div>
        <color-picker
          v-model="color"
          v-if="pickerVisible"
          @change-color="onChange"
          class="colorpicker-menu"/>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Component, Watch, Prop } from 'vue-property-decorator';
import { debounce } from 'lodash-decorators';
import { TObsType, IInputValue, Input } from './Input';
const VueColor = require('vue-color');

interface IColor {
  hex: string,
  a: number
}

@Component({
  components: { ColorPicker: VueColor.Sketch }
})
class ColorInput extends Input<IInputValue<string>> {

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
      this.emitInput({ ...this.value, value: this.hexRGBA });
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
    let obsStr = this.value.value;

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
@import "../../../styles/index";
.colorpicker {
  position: relative;
  width: 220px;
}

.colorpicker__text {
  position: relative;
  cursor: pointer;
}

.colorpicker__input {
  cursor: pointer !important;
}

.colorpicker__swatch {
  position: absolute;
  top: 8px;
  right: 8px;
  border-radius: 2px;
  border: 1px solid #ccc;
  width: 20px;
  height: 20px;
}

.colorpicker-menu {
  top: 6px;
  z-index: 10;
  background: @day-input-bg !important;
  .radius !important;
  border: 1px solid @day-input-border !important;
  box-shadow: none !important;
}

.night-theme {
  .colorpicker-menu {
    background: @night-secondary !important;
    border-color: @night-secondary !important;
  }

  .vue-color__editable-input__label {
    color: @grey !important;
  }

  .vue-color__sketch__presets {
    border-color: @night-border;
  }

}
</style>
