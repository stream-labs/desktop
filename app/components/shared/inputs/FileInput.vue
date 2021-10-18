<template>
  <span class="file-input">
    <div class="flex">
      <input
        type="text"
        readonly
        :value="value"
        :name="options.uuid"
        class="file-input__input"
        v-validate="validate"
      />
      <button @click="showFileDialog" class="file-input__browse-button button button--default">
        {{ $t('Browse') }}
      </button>
    </div>
    <span class="input-error" v-show="errors.first(uuid)">
      {{ errors.first(uuid) }}
    </span>
  </span>
</template>

<script lang="ts" src="./FileInput.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';

.file-input {
  flex-grow: 1;
  position: relative;

  .input-error {
    .absolute(100%);

    white-space: nowrap;
  }
}

.file-input__input {
  flex-grow: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  width: 100%;
}

.file-input__browse-button {
  flex-shrink: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
  margin-right: 0;
}
</style>
