<template>
  <span class="text-input" data-role="input" data-type="text" :data-name="options.name">
    <input
        type="text"
        :placeholder="options.placeholder"
        :value="value"
        @input="emitInput($event.target.value)"
        :name="uuid"
        v-validate="validate"
    />
  </span>
</template>

<script lang="ts" src="./TextInput.vue.ts"></script>

<style lang="less" scoped>
  @import "../../../styles/index";

  .text-input {
    position: relative;
    display: flex;
  }
</style>
