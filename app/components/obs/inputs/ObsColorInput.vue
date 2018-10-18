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


</style>
