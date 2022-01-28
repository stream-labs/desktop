<template>
  <modal-layout :show-controls="false" :customControls="true">
    <div slot="content">
      <p class="confirm-title">{{ $t('settings.autoCompact.title') }}</p>
      <ul class="confirm-list">
        <p class="confirm-title">{{ $t('settings.autoCompact.message') }}</p>
      </ul>
      <BoolInput :value="doNotShowAgain" @input="setDoNotShowAgain" />
    </div>
    <div slot="controls">
      <button class="button button--default" @click="skip">
        {{ $t('settings.autoCompact.later') }}
      </button>
      <button class="button button--action" @click="activate">
        {{ $t('settings.autoCompact.activate') }}
      </button>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./AutoCompactConfirmDialog.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.input-container {
  flex-direction: column;
}
.confirm-list {
  list-style: none;
  background: @bg-tertiary;
  .radius;
  margin: 0;
  padding: 8px;
}
</style>
