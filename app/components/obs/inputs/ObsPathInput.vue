<template>
<h-form-group :title="value.description">
  <div class="path-input__row">
    <text-input :value="value.value" @input="handleChange" :metadata="{ disabled: value.enabled === false, name: value.name, fullWidth: true }" />
    <button @click="showFileDialog" class="button button--default" :disabled="value.enabled === false">
      {{ $t('Browse') }}
    </button>
  </div>
</h-form-group>
</template>

<script lang="ts" src="./ObsPathInput.vue.ts"></script>

<style lang="less" scoped>
  .path-input__row {
    display: flex;
    flex-wrap: nowrap;

    > span {
      flex-wrap: nowrap;
      width: 100%;
    }

    button {
      margin: 0;
      margin-left: -5px;
    }
  }
</style>
