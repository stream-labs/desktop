<template>
<h-form-group :title="value.description">
  <div class="path-input__row">
    <text-input :value="value.value" @input="handleChange" />
    <button @click="showFileDialog" class="button button--default">
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
      margin-left: 12px;
    }
  }
</style>
