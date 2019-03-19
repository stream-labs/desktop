<template>
  <ModalLayout :showControls="false" :customControls="true" :containsTabs="true">
    <div slot="fixed">
      <div class="row">
        <div class="small-6 columns position--relative window-tab">
          <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
        </div>
        <div class="small-6 columns position--relative window-tab">
          <div class="window-toggle__wrapper">
            <div @click="onTogglePollPreferencesWindowHandler">
              <span>{{ $t('Edit Command') }}</span>
              <i class="fas fa-chevron-right window-toggle__icon"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <validated-form ref="form" slot="content" class="chatbot-symbol-protection__container">
      <div class="poll-tabs__general" v-show="selectedTab === 'general'">
        <div class="section">
          <div class="section-content">
            <BoolInput
              :title="$t('Repeat Message')"
              v-model="newPollPreferences.settings.general.repeat_active.enabled"
            />
            <VFormGroup
              v-model="newPollPreferences.settings.general.repeat_active.message"
              :metadata="metaData.repeat"
            />
            <VFormGroup
              :title="$t('Chat Lines')"
              v-model="newPollPreferences.settings.general.repeat_active.chat_lines"
              :metadata="metaData.chatLines"
              v-if="selectedTab === 'general'"
            />
          </div>
        </div>
      </div>
      <div class="poll-tabs__messages" v-show="selectedTab === 'messages'">
        <div class="section">
          <div class="section-content">
            <VFormGroup
              :title="$t('Open Message')"
              v-model="newPollPreferences.settings.messages.open"
              :metadata="metaData.open"
            />
            <VFormGroup
              :title="$t('Close Message')"
              v-model="newPollPreferences.settings.messages.close"
              :metadata="metaData.close"
            />
            <VFormGroup
              :title="$t('Cancel Message')"
              v-model="newPollPreferences.settings.messages.cancel"
              :metadata="metaData.cancel"
            />
          </div>
        </div>
        <div class="section">
          <div class="section-content">
            <VFormGroup
              :title="$t('Win Message')"
              v-model="newPollPreferences.settings.messages.results.win"
              :metadata="metaData.win"
            />
            <VFormGroup
              :title="$t('Tie Message')"
              v-model="newPollPreferences.settings.messages.results.tie"
              :metadata="metaData.win"
            />
          </div>
        </div>
      </div>
    </validated-form>
    <div slot="controls" class="flex flex--space-between">
      <button class="button button--default" @click="onResetHandler">{{ $t('Reset') }}</button>
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

<script lang="ts" src="./ChatbotPollPreferencesWindow.vue.ts"></script>

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

.window-toggle__wrapper {
  background-color: @day-primary;
  z-index: 1;
  width: 100%;
  padding: 15px;
  padding-left: 0px;
  height: 48px;
  border-bottom: 1px solid @day-border;
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}

.night-theme {
  .window-toggle__wrapper {
    background-color: @night-primary;
    border-color: @night-border;
  }
  .loyalty-flex__underline {
    border-bottom-color: @night-border;
    border-bottom-width: 1px;
    border-bottom-style: solid;
    .margin-bottom(2);
  }
}
</style>
