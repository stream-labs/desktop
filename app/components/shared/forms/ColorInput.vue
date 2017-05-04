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

<script>
import { Sketch } from 'vue-color';
import _ from 'lodash';


import Input from './Input.vue';

const ColorProperty = Input.extend({

  components: {
    ColorPicker: Sketch
  },

  data() {
    return {
      color: {
        hex: '#ffffff',
        a: 1
      },

      pickerVisible: false
    };
  },

  methods: {
    onChange(color) {
      this.color = color;
    },

    togglePicker() {
      this.pickerVisible = !this.pickerVisible;
    },

    setValue: _.debounce(function () {
      if ((this.color.a !== this.obsColor.a) || (this.color.hex !== this.obsColor.hex)) {
        this.$emit('input', Object.assign({}, this.value, { currentValue: this.hexRGBA }));
      }
    }, 500),
  },

  watch: {
    color() {
      this.setValue();
    },

    obsColor() {
      this.color = this.obsColor;
    }
  },

  created() {
    this.color = this.obsColor;
  },

  computed: {
    hexAlpha() {
      let alpha = this.color.a;
      return _.padStart(Math.floor(alpha * 255).toString(16), 2, '0');
    },

    hexColor() {
      return this.color.hex.substr(1);
    },

    // This is what node-obs uses
    hexRGBA() {
      return (this.hexColor + this.hexAlpha).toLowerCase();
    },

    // This is displayed to the user
    hexARGB() {
      return ('#' + this.hexAlpha + this.hexColor).toLowerCase();
    },

    swatchStyle() {
      return {
        backgroundColor: this.color.hex,
        opacity: this.color.a || 1
      };
    },

    // This represents the actual value in the property in OBS
    obsColor() {
      let obsStr = this.value.currentValue;

      return {
        hex: '#' + obsStr.substr(0, 6),
        a: parseInt(obsStr.substr(6), 16) / 255
      };
    }
  }
});
ColorProperty.obsType = 'OBS_PROPERTY_COLOR';
export default ColorProperty;

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
