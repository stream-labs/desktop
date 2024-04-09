<template>
  <modal-layout :show-controls="false" :customControls="true">
    <div slot="content">
      <div v-if="operation === 'add'">
        <p class="confirm-title">{{ `${userName}さんをモデレーターに追加しますか?` }}</p>
        <p class="confirm-description">追加すると視聴中または視聴を開始した追加対象のユーザーに通知されます</p>
        <p class="about-moderator">モデレーターとは
          <i class="icon-help icon-tooltip" v-tooltip.bottom="'TODO: モデレーターの説明'"></i>
        </p>
      </div>
      <div v-else-if="operation === 'remove'">
        <p class="confirm-title">{{ `${userName}さんをモデレーターから削除しますか?` }}</p>
        <p class="confirm-description">削除されたことは削除対象のユーザーに通知されません</p>
      </div>
    </div>
    <div slot="controls">
      <button class="button button--secondary" :disabled="isClosing" @click="cancel">
        {{ $t('common.cancel') }}
      </button>
      <button class="button button--primary" :disabled="isClosing" @click="ok">
        {{ operation === 'add' ? '追加する' : operation === 'remove' ? '削除する' : operation }}
      </button>
    </div>
  </modal-layout>
</template>

<script lang="ts" src="./ModeratorConfirmDialog.vue.ts"></script>

<style lang="less" scoped>
@import url('../../styles/index');

.confirm-title {
  // TODO
  color: var(--color-text-light);
}

.confirm-description {
  // TODO
  color: var(--color-text-light);
}

.about-moderator {
  // TODO
  color: var(--color-button-primary);
}

</style>
