<template>
  <span class="number-input">
    <input
        type="number"
        :placeholder="metadata.placeholder"
        :value="value"
        @input="emitInput($event.target.value)"
        :name="uuid"
        v-validate="validate"
    />
    <div v-if="metadata && metadata.tooltip" class="w-tooltip">
      <i class="icon-question icon-btn" v-tooltip="metadata.tooltip" />
    </div>
    <span class="input-error" v-show="errors.first(uuid)">
      {{ errors.first(uuid) }}
    </span>
  </span>
</template>

<script lang="ts" src="./NumberInput.vue.ts"></script>

<style lang="less" scoped>
  .number-input {
    position: relative;
    display: flex;

    input {
      width: 220px;
    }
    .input-error {
      position: absolute;
      white-space: nowrap;
    }
  }
</style>
