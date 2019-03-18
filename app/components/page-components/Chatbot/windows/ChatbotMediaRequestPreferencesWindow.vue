
<template>
  <ModalLayout :showControls="false" :customControls="true">
    <div slot="fixed">
      <div class="window-toggle__wrapper">
        <div @click="onToggleMediaRequestWindowHandler">
          <span>{{ $t('Edit Primary Command') }}</span>
          <i class="fas fa-chevron-right window-toggle__icon"></i>
        </div>
      </div>
    </div>
    <div slot="content" class="settings-container">
      <validated-form ref="form">
        <div v-if="mediaRequestData">
          <VFormGroup
            :title="$t('Queue Limit')"
            v-model="mediaRequestData.general.limit"
            :metadata="metadata.general.limit"
          />
          <VFormGroup
            :title="$t('Max Duration (Value in Seconds)')"
            v-model="mediaRequestData.general.max_duration"
            :metadata="metadata.general.max_duration"
          />
          <VFormGroup
            :title="$t('Spam Security')"
            v-model="mediaRequestData.general.filter_level"
            :metadata="metadata.general.filter_level"
          />
          <VFormGroup
            :title="$t('Max Requests per User')"
            v-model="mediaRequestData.general.max_requests_per_user"
            :metadata="metadata.general.max_requests_per_user"
          />
          <VFormGroup
            :title="$t('Votes Required to Skip')"
            v-model="mediaRequestData.general.skip_votes"
            :metadata="metadata.general.skip_votes"
          />
          <BoolInput
            :title="$t('Limit requests to Music Only')"
            v-model="mediaRequestData.general.music_only"
          />
        </div>
      </validated-form>
    </div>
    <div slot="controls" class="flex flex--space-between">
      <div>
        <button class="button button--default" @click="onCancelHandler">{{ $t('Cancel') }}</button>
        <button
          class="button button--action"
          @click="onSaveHandler"
          :disabled="errors.items.length > 0"
        >{{ $t("Save") }}</button>
      </div>
    </div>
  </ModalLayout>
</template>

<script lang="ts" src="./ChatbotMediaRequestPreferencesWindow.vue.ts"></script>

<style lang="less" scoped>
@import '../../../../styles/index';
.window-tab {
  &:first-child {
    padding-right: 0;
  }
  &:last-child {
    padding-left: 0;
  }
}
.chatbot-empty-placeholder__container {
  .flex();
  .flex--column();
  .flex--center();
  .padding-vertical--20;
}
.settings-container {
  margin-top: 45px;
}
.window-toggle__wrapper {
  background-color: var(--background);
  z-index: 1;
  width: 100%;
  padding: 15px;
  height: 48px;
  border-bottom: 1px solid var(--dropdown-border);
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}

</style>