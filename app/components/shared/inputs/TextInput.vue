<template>
  <span class="text-input" data-role="input" data-type="text" :data-name="options.name">
    <input
        :type="textVisible ? 'text' : 'password'"
        :placeholder="options.placeholder"
        :value="value"
        @input="emitInput($event.target.value)"
        :name="uuid"
        v-validate="validate"
        :disabled="metadata.disabled"
    />
    <button
      class="button button--input button--default"
      v-if="metadata.masked"
      @click="toggleVisible">
      {{ textVisible ? $t('Hide') : $t('Show') }}
    </button>
  </span>
</template>

<script lang="ts" src="./TextInput.vue.ts"></script>

<style lang="less" scoped>
  @import "../../../styles/index";

  .text-input {
    position: relative;
    display: flex;
  }

  .button--input {
    flex: 0 0 auto;
    width: 80px;
    margin-left: 12px;
  }
</style>
