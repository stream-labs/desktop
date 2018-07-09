<template>
  <textarea
      type="text"
      :placeholder="metadata.placeholder"
      :value="value"
      @input="emitInput($event.target.value)"
      class="text-area radius"
  />
</template>

<script lang="ts" src="./WTextAreaInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.night-theme {
  .text-area:focus {
    background-color: @night-hover;
    border-color: @teal-light-opac;
  }
}
</style>
