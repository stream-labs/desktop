<template>
  <span class="text-input">
    <input
        type="text"
        :placeholder="metadata.placeholder"
        :value="value"
        @input="emitInput($event.target.value)"
        :name="uuid"
        v-validate="validate"
    />
    <span class="input-error" v-show="errors.first(uuid)">
      {{ errors.first(uuid) }}
    </span>
  </span>
</template>

<script lang="ts" src="./TextInput.vue.ts"></script>

<style lang="less" scoped>
  .text-input {
    position: relative;
    .input-error {
      position: absolute;
      white-space: nowrap;
    }
  }
</style>
