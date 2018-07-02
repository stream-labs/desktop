<template>
<div
  class="color-picker"
  ref="colorpicker">
  <label>{{ value.description }}</label>
	<input
    type="text"
    class="color-picker__input"
    :value="value"
    @click="displayPicker = !displayPicker"
    @input="updateFromInput" />

  <div
    class="color-picker__current"
    :style="'background-color: ' + value"
    @click="displayPicker = !displayPicker"></div>

  <sketch-picker
    v-model="colors"
    @input="updateFromPicker"
    v-if="displayPicker"
    :disable-fields="true"
    :disable-alpha="true"
    class="color-picker__picker" />
</div>
</template>

<script lang="ts" src="./WColorInput.vue.ts"></script>

<style lang="less">
@import "../../../styles/index";

.color-picker {
  position: relative;
  width: 200px;
}

.color-picker__current {
  width: 20px;
  height: 20px;
  .radius;
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 10;
}

.color-picker__picker {
  position: absolute!important;
  top: 36px;
  left: 0;
  z-index: 100;
}
</style>
