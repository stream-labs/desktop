<template>
<div class="widget-layout-picker">
  <div
    v-for="option in metadata.options"
    :key="option.value"
    class="widget-layout-picker__option"
    :class="[value === option.value ? 'active' : '']"
    @click="emitInput(option.value)"
  >
    <img :src="option.description" >
  </div>
</div>
</template>

<script lang="ts" src="./ImagePickerInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.widget-layout-picker {
  width: 100%;
  max-width: 370px;
  display: grid;
  grid-template-columns: repeat( auto-fit, 64px);
  grid-column-gap: 8px;
}

.widget-layout-picker__option {
  width: 64px;
  height: 64px;
  border: 1px solid var(--solid-input);
  background-color: var(--solid-input);
  .transition();
  position: relative;
  .radius();
  cursor: pointer;

  img {
    height: 48px;
    width: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  &.active {
    background-color: var(--link-active);
    border-color: var(--link-active);
  }
}
</style>
