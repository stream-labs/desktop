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
          :value="obsColor"
          @input="(value) => setValue(value.rgba)"
          v-if="pickerVisible"
          class="colorpicker-menu"/>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./ObsColorInput.vue.ts"></script>

<style lang="less">
@import "../../../styles/index";
.colorpicker {
  position: relative;
  width: 220px;

  .colorpicker__text {
    position: relative;
    cursor: pointer;
  }

  .colorpicker__input {
    cursor: pointer !important;
    background: @day-dropdown-bg;
    border-color: @day-dropdown-border;
  }


  .colorpicker__swatch {
    position: absolute;
    top: 7px;
    right: 8px;
    border-radius: 2px;
    border: 1px solid #ccc;
    width: 20px;
    height: 20px;
  }

  .colorpicker-menu {
    top: 6px;
    z-index: 10;
    background: @day-dropdown-bg !important;
    .radius() !important;
    border: 1px solid @day-dropdown-border !important;
    box-shadow: none !important;
  }
}

.night-theme {
  .colorpicker {
    .colorpicker-menu {
      background: @night-dropdown-bg !important;
      border-color: @night-dropdown-border !important;
    }

    .colorpicker__input {
      background: @night-dropdown-bg;
      border-color: @night-dropdown-border;
    }

    .vue-color__editable-input__label {
      color: @grey !important;
    }

    .vue-color__sketch__presets {
      border-color: @night-border;
    }
  }
}
</style>
