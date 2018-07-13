<template>
  <span class="w-text-input">
    <input
        type="text"
        :placeholder="metadata.placeholder"
        :value="value"
        @input="emitInput($event.target.value)"
        :name="uuid"
        v-validate="{
          required: required,
          max: max,
          date_format: dateFormat
        }"
    />
    <span class="input-error" v-show="errors.first(uuid)">
      {{ errors.first(uuid) }}
    </span>
  </span>
</template>

<script lang="ts" src="./WTextInput.vue.ts"></script>

<style lang="less" scoped>
  .w-text-input {
    position: relative;
    .input-error {
      position: absolute;
      white-space: nowrap;
    }
  }
</style>
