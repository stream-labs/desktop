<template>
<div class="input-container">
  <div class="input-label">
    <label>{{ value.description }}</label>
  </div>
  <div class="input-wrapper">
    <div class="flex">
      <input
        type="text"
        ref="input"
        :value="value.value"
        class="path__input"
        @change="handleChange">
      <button
        @click="showFileDialog"
        class="path__browse-button button button--default">
        {{ $t('Browse') }}
      </button>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./ObsPathInput.vue.ts"></script>

<style lang="less" scoped>

</style>
