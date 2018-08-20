<template>
<div>

    <div class="input-wrapper">
      <div class="colorpicker">
        <div
            class="colorpicker__text"
            @click="togglePicker">
          <input
              class="colorpicker__input"
              type="text"
              readonly
              :value="value">
          <div
              class="colorpicker__swatch"
              :style="swatchStyle"/>
        </div>
        <color-picker
            :value="{hex: value}"
            @input="(value) => emitInput(value.hex)"
            v-if="pickerVisible"
            class="colorpicker-menu"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./ColorInput.vue.ts"></script>

<style lang="less">
@import "../../../styles/index";
.colorpicker {
  position: relative;
  width: 220px;

  .colorpicker__input {
    cursor: pointer !important;
    background: @day-dropdown-bg;
    border-color: @day-dropdown-border;

    &:focus,
    &:visited,
    &:active {
      background: @day-dropdown-bg;
      border-color: @day-dropdown-border;
    }
  }

  .colorpicker__text {
    position: relative;
    cursor: pointer;
  }

  .colorpicker__swatch {
    position: absolute;
    top: 7px;
    right: @spacing;
    .radius();
    border: 1px solid #ccc;
    width: 20px;
    height: 20px;
  }

  .colorpicker-menu {
    top: -2px;
    z-index: 10;
    border-bottom-right-radius: @radius;
    border-bottom-left-radius: @radius;
    background: @day-dropdown-bg;
    border-color: @day-dropdown-border;
    box-shadow: none !important;
  }

  // hide alpha input
  .vc-alpha {
    display: none;
  }
  .vc-sketch-field > div:last-child {
    display: none;
  }

  .vc-sketch-presets {
    margin-right: -8px;
    margin-left: -8px;
    padding-left: 8px;
    padding-top: 8px;
    border-top: 1px solid @day-border;
  }

  .vc-sketch-field .vc-input__label {
    color: @icon;
  }

  .vc-checkerboard {
    display: none;
  }
}

.night-theme {
  .colorpicker {
  .colorpicker__input {
    background: @night-dropdown-bg;
    border-color: @night-dropdown-border;

    &:focus,
    &:visited,
    &:active {
      background: @night-dropdown-bg;
      border-color: @night-dropdown-border;
    }
  }

    .colorpicker-menu {
      background: @night-dropdown-bg!important;
      border-color: @night-dropdown-border!important;
    }

    .vue-color__editable-input__label {
      color: @grey !important;
    }

    .vue-color__sketch__presets {
      border-color: @night-border;
    }

    .vc-sketch-presets {
      border-color: @night-border;
    }
  }
}
</style>
