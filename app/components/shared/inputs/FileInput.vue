<template>
<span>
  <div class="flex">
    <input
      type="text"
      readonly
      :value="value"
      class="path__input">
    <button
      @click="showFileDialog"
      class="path__browse-button button button--default">
      {{ $t('Browse') }}
    </button>
  </div>
</span>
</template>

<script lang="ts" src="./FileInput.vue.ts"></script>

<style lang="less" scoped>
.path__input {
  flex-grow: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.path__browse-button {
  flex-shrink: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
}
</style>
