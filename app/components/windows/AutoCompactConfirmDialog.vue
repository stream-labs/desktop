<template>
  <modal-layout :show-controls="false" :customControls="true" no-scroll>
    <div slot="content">
      <ul class="confirm-list">
        <li class="confirm-list-item">
          <p class="confirm-message">{{ $t('settings.autoCompact.message') }}</p>
          <BoolInput :value="doNotShowAgain" @input="setDoNotShowAgain" />
        </li>
      </ul>  
    </div>
    <div slot="controls">
      <button class="button button--secondary" @click="skip">
        {{ $t('settings.autoCompact.later') }}
      </button>
      <button class="button button--primary" @click="activate">
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
.confirm-message {
  color: var(--color-text);
  margin-bottom: 24px;
  white-space: pre-line;
}
.confirm-list {
  list-style: none;
  margin: 0;
}
.confirm-list-item {
  .radius;
  color: var(--color-text);
  margin-bottom: 16px;
  padding: 16px 16px 0;
  list-style: none;
  background: var(--color-bg-secondary);
}
</style>
