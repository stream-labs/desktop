<template>
  <ModalLayout :showControls="false" :customControls="true">
    <div slot="fixed">
      <div class="window-toggle__wrapper">
        <div @click="onToggleQueueWindowHandler">
          <span>{{ $t('Edit Primary Command') }}</span>
          <i class="fas fa-chevron-right window-toggle__icon"></i>
        </div>
      </div>
    </div>
    <div slot="content" class="chatbot-quote-preferences__container">
      <validated-form ref="form">
        <div>
          <VFormGroup
            :title="$t('Maximum Queue Size')"
            v-model="generalSettings.maximum"
            :metadata="metadata.maximum"
          />
          <VFormGroup
            :title="$t('Pick User Message')"
            v-model="generalSettings.messages.picked"
            :metadata="metadata.messages.picked"
          />
        </div>
      </validated-form>
    </div>
    <div slot="controls">
      <button class="button button--default" @click="onCancelHandler">{{ $t('Cancel') }}</button>
      <button
        class="button button--action"
        @click="onSaveHandler"
        :disabled="errors.items.length > 0 || !generalSettings.messages.picked"
      >{{ $t('Save') }}</button>
    </div>
  </ModalLayout>
</template>

<script lang="ts" src="./ChatbotQueuePreferencesWindow.vue.ts"></script>

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

.chatbot-quote-preferences__container {
  padding-top: 45px;
}
</style>
