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

  // hide alpha input
  .colorpicker .vc-alpha {
    display: none;
  }
  .colorpicker .vc-sketch-field > div:last-child {
    display: none;
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
