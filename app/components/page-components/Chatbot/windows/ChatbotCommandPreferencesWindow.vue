<template>
  <ModalLayout :showControls="false" :customControls="true">
    <div slot="content" class="chatbot-command-preferences__container">
      <validated-form ref="form">
        <div class="section">
          <div class="section-content">
            <BoolInput :title="$t('Send Cooldown Message')" v-model="settings.displayCooldown"/>
            <VFormGroup v-model="settings.cooldownMessage" :metadata="metaData.cooldown"/>
            <BoolInput :title="$t('Send Cost Message')" v-model="settings.displayCost"/>
            <VFormGroup v-model="settings.costMessage" :metadata="metaData.cost"/>
            <BoolInput :title="$t('Send Permission Message')" v-model="settings.displayPermission"/>
            <VFormGroup v-model="settings.permissionMessage" :metadata="metaData.permission"/>
          </div>
        </div>
      </validated-form>
    </div>
    <div slot="controls">
      <button class="button button--default" @click="onCancelHandler">{{ $t('Cancel') }}</button>
      <button
        class="button button--action"
        @click="onSaveHandler"
        :disabled="errors.items.length > 0"
      >{{ $t('Save') }}</button>
    </div>
  </ModalLayout>
</template>

<script lang="ts" src="./ChatbotCommandPreferencesWindow.vue.ts"></script>

<style <style lang="less" scoped>
@import '../../../../styles/index';

.window-toggle__wrapper {
  background-color: var(--background);
  z-index: 1;
  width: 100%;
  padding: 15px;
  height: 48px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}
</style>
