<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Edit Command')"
>
  <div slot="fixed">
    <div class="row">
      <div class="small-6 columns position--relative">
        <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
      </div>
      <div class="small-6 columns position--relative">
        <div class="window-toggle__wrapper">
          <div
            @click="onToggleLinkProtectionWindowHandler"
            v-if="isLinkProtectionPermitCommand"
          >
            <span> {{ $t('Link Protection Preferences') }} </span>
            <i class="fas fa-chevron-right window-toggle__icon"></i>
          </div>
          <div
            @click="onToggleQuoteWindowHandler"
            v-if="isQuoteCommand"
          >
            <span> {{ $t('Quote Preferences') }} </span>
            <i class="fas fa-chevron-right window-toggle__icon"></i>
          </div>
          <div
            @click="onToggleQueueWindowHandler"
            v-if="isQueueJoinCommand"
          >
            <span> {{ $t('Queue Settings') }} </span>
            <i class="fas fa-chevron-right window-toggle__icon"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="editedCommand"
    slot="content"
    class="chatbot-add-command__container"
  >
    <transition name='fade' mode="out-in" appear>
      <validated-form ref="form">
        <div v-if="selectedTab === 'general'">
          <VFormGroup
            :title="$t('Command')"
            v-model="editedCommand.command"
            :metadata="metadata.command"
          />
          <VFormGroup
            v-if="defaultCommandToUpdate.response"
            :title="$t('Response (Line breaks will be ignored)')"
            v-model="editedCommand.response"
            :metadata="metadata.response"
          />
          <VFormGroup
            v-if="defaultCommandToUpdate.success_response"
            :title="$t('Success Response (Line breaks will be ignored)')"
            v-model="editedCommand.success_response"
            :metadata="metadata.success_response"
          />
          <VFormGroup
            v-if="defaultCommandToUpdate.failed_response"
            :title="$t('Failed Response (Line breaks will be ignored)')"
            v-model="editedCommand.failed_response"
            :metadata="metadata.failed_response"
          />
          <VFormGroup
            v-if="defaultCommandToUpdate.enabled_response"
            :title="$t('Enabled Response (Line breaks will be ignored)')"
            v-model="editedCommand.enabled_response"
            :metadata="metadata.enabled_response"
          />
          <VFormGroup
            v-if="defaultCommandToUpdate.disabled_response"
            :title="$t('Disabled Response (Line breaks will be ignored)')"
            v-model="editedCommand.disabled_response"
            :metadata="metadata.disabled_response"
          />
          <VFormGroup
            v-if="defaultCommandToUpdate.response_type"
            :title="$t('Reply in')"
            v-model="editedCommand.response_type"
            :metadata="metadata.response_type"
          />
        </div>
        <div v-if="selectedTab === 'advanced'">
          <ChatbotAliases v-model="editedCommand.aliases" />
        </div>
      </validated-form>
    </transition>
  </div>
  <div slot="controls" class="flex flex--space-between">
    <button class="button button--default" @click="onResetCommandHandler">
      {{ $t('Reset Command') }}
    </button>
    <div>
      <button class="button button--default" @click="onCancelHandler">
        {{ $t('Cancel') }}
      </button>
      <button
        class="button button--action"
        @click="onSaveHandler"
      >
        {{ $t("Save") }}
      </button>
    </div>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotDefaultCommandWindow.vue.ts"></script>

<style <style lang="less" scoped>
@import "../../../../styles/index";
.chatbot-add-command__container {
  padding-top: 45px;
}

.window-toggle__wrapper {
  background-color: @day-primary;
  z-index: 1;
  width: 100%;
  padding: 15px;
  height: 54px;
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
}
</style>
