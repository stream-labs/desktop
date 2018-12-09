<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
>
  <div slot="fixed">
   <div class="window-toggle__wrapper">
    <div @click="onToggleQuoteWindowHandler">
      <span> {{ $t('Edit Command') }} </span>
      <i class="fas fa-chevron-right window-toggle__icon"></i>
    </div>
  </div>
  </div>
  <div slot="content" class="chatbot-quote-preferences__container">
    <validated-form ref="form">
      <VFormGroup
        :title="$t('Date Format')"
        v-model="generalSettings.date_format"
        :metadata="metadata.date_format"
      />
    </validated-form>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="onCancelHandler">
      {{ $t('Cancel') }}
    </button>
    <button
      class="button button--action"
      @click="onSaveHandler"
      :disabled="errors.items.length > 0"
    >
      {{ $t('Save') }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotQuotePreferencesWindow.vue.ts"></script>

<style <style lang="less" scoped>
@import "../../../../styles/index";

.window-toggle__wrapper {
  background-color: @day-primary;
  z-index: 1;
  width: 100%;
  padding: 15px;
  height: 48px;
  border-bottom: 1px solid @day-border;
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}

.chatbot-quote-preferences__container {
  padding-top: 45px;
}

.night-theme {
  .window-toggle__wrapper {
    background-color: @night-primary;
    border-color: @night-border;
  }
}
</style>
