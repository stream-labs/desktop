<template>
  <span class="w-number-input">
    <input
        type="number"
        :placeholder="metadata.placeholder"
        :value="value"
        @input="emitInput($event.target.value)"
        :name="uuid"
        v-validate="{
          required: required,
          max_value: max,
          min_value: min
        }"
    />
    <span class="input-error" v-show="errors.first(uuid)">
      {{ errors.first(uuid) }}
    </span>
  </span>
</template>

<script lang="ts" src="./WNumberInput.vue.ts"></script>

<style lang="less" scoped>
  .w-number-input {
    position: relative;
    .input-error {
      position: absolute;
      white-space: nowrap;
    }
  }
</style>
