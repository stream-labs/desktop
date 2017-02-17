<template>
<div>
  <label>{{ property.description }}</label>
  <div class="ColorPicker-text">
    <input
      type="text"
      :value="hexWithAlpha"
      @focus="showPicker">
    <div
      class="ColorPicker-swatch"
      :style="swatchStyle"/>
  </div>
  <div
    v-if="pickerVisible"
    @click="hidePicker">
    <div
      style="display: inline-block;"
      @click.stop>
      <color-picker
        v-model="color"
        @change-color="onChange"/>
    </div>
  </div>
</div>
</template>

<script>
import { Sketch } from 'vue-color';

export default {

  components: {
    ColorPicker: Sketch
  },

  data() {
    return {
      color: {
        hex: '#ff0077',
        a: 1
      },

      pickerVisible: false
    };
  },

  props: [
    'property'
  ],

  methods: {
    onChange(color) {
      this.color = color
    },

    showPicker() {
      this.pickerVisible = true;
    },

    hidePicker() {
      this.pickerVisible = false;
    },

    setValue(event) {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: event.target.value
      });
    }
  },

  computed: {
    hexWithAlpha() {
      let alpha = this.color.a || 1;
      let hexAlpha = Math.floor(alpha * 255).toString(16);
      let hexColor = this.color.hex.substr(1);

      return '#' + hexAlpha + hexColor;
    },

    swatchStyle() {
      return {
        backgroundColor: this.color.hex,
        opacity: this.color.a || 1
      };
    }
  }

};
</script>

<style lang="less">
.ColorPicker-text {
  position: relative;
}

.ColorPicker-swatch {
  position: absolute;
  top: 8px;
  right: 8px;
  border-radius: 2px;

  width: 20px;
  height: 20px;
}
</style>
