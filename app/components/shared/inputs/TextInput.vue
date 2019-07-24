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
    <div v-if="metadata && metadata.tooltip" class="w-tooltip">
      <i class="icon-question icon-btn" v-tooltip="metadata.tooltip" />
    </div>
    <span class="input-error" v-show="errors.first(uuid)">
      {{ errors.first(uuid) }}
    </span>
  </span>
</template>

<script lang="ts" src="./TextInput.vue.ts"></script>

<style lang="less" scoped>
  @import "../../../styles/index";

  .text-input {
    position: relative;
    display: flex;

    .input-error {
      .absolute(100%);
      white-space: nowrap;
    }
  }
</style>
