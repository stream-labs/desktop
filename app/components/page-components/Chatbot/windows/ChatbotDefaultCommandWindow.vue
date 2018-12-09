<template>
  <ModalLayout :showControls="false" :customControls="true" :containsTabs="true">
    <div slot="fixed">
      <div class="row">
        <div class="small-6 columns position--relative window-tab">
          <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
        </div>
        <div class="small-6 columns position--relative window-tab">
          <div class="window-toggle__wrapper">
            <div @click="onToggleLinkProtectionWindowHandler" v-if="isLinkProtectionPermitCommand">
              <span>{{ $t('Link Protection Preferences') }}</span>
              <i class="fas fa-chevron-right window-toggle__icon"></i>
            </div>
            <div @click="onToggleQuoteWindowHandler" v-if="isQuoteCommand">
              <span>{{ $t('Quote Preferences') }}</span>
              <i class="fas fa-chevron-right window-toggle__icon"></i>
            </div>
            <div @click="onToggleQueueWindowHandler" v-if="isQueueJoinCommand">
              <span>{{ $t('Queue Settings') }}</span>
              <i class="fas fa-chevron-right window-toggle__icon"></i>
            </div>
            <div @click="onToggleSongRequestWindowHandler" v-if="isSongRequestCommand">
              <span>{{ $t('Song Request Preferences') }}</span>
              <i class="fas fa-chevron-right window-toggle__icon"></i>
            </div>
            <div @click="onToggleLoyaltyPreferencesWindowHandler" v-if="isLoyaltyCommand">
              <span>{{ $t('Loyalty Preferences') }}</span>
              <i class="fas fa-chevron-right window-toggle__icon"></i>
            </div>
            <div @click="onToggleHeistPreferencesWindowHandler" v-if="isHeistCommand">
              <span>{{ $t('Heist Preferences') }}</span>
              <i class="fas fa-chevron-right window-toggle__icon"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="editedCommand" slot="content" class="chatbot-add-command__container">
      <transition name="fade" mode="out-in" appear>
        <validated-form ref="form">
          <div v-if="selectedTab === 'general'">
            <VFormGroup
              :title="$t('Command')"
              v-model="editedCommand.command"
              :metadata="metadata.command"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.response"
              :title="$t('Response')"
              v-model="editedCommand.response"
              :metadata="metadata.response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.success_response"
              :title="$t('Success Response')"
              v-model="editedCommand.success_response"
              :metadata="metadata.success_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.failed_response"
              :title="$t('Failed Response')"
              v-model="editedCommand.failed_response"
              :metadata="metadata.failed_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.enabled_response"
              :title="$t('Enabled Response')"
              v-model="editedCommand.enabled_response"
              :metadata="metadata.enabled_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.disabled_response"
              :title="$t('Disabled Response')"
              v-model="editedCommand.disabled_response"
              :metadata="metadata.disabled_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.duration_response"
              :title="$t('Duration Response')"
              v-model="editedCommand.duration_response"
              :metadata="metadata.duration_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.rating_response"
              :title="$t('Rating Response')"
              v-model="editedCommand.rating_response"
              :metadata="metadata.rating_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.views_response"
              :title="$t('Views Response')"
              v-model="editedCommand.views_response"
              :metadata="metadata.views_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.banned_response"
              :title="$t('Banned Response')"
              v-model="editedCommand.banned_response"
              :metadata="metadata.banned_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.music_response"
              :title="$t('Banned Response')"
              v-model="editedCommand.music_response"
              :metadata="metadata.music_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.max_response"
              :title="$t('Max Response')"
              v-model="editedCommand.max_response"
              :metadata="metadata.max_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.full_response"
              :title="$t('Full Response')"
              v-model="editedCommand.full_response"
              :metadata="metadata.full_response"
            />
            <VFormGroup
              v-if="defaultCommandToUpdate.response_type"
              :title="$t('Reply in')"
              v-model="editedCommand.response_type"
              :metadata="metadata.response_type"
            />
          </div>
          <div v-if="selectedTab === 'advanced'">
            <ChatbotAliases v-model="editedCommand.aliases"/>
          </div>
        </validated-form>
      </transition>
    </div>
    <div slot="controls" class="flex flex--space-between">
      <button
        class="button button--default"
        @click="onResetCommandHandler"
      >{{ $t('Reset Command') }}</button>
      <div>
        <button class="button button--default" @click="onCancelHandler">{{ $t('Cancel') }}</button>
        <button class="button button--action" @click="onSaveHandler">{{ $t("Save") }}</button>
      </div>
    </div>
  </ModalLayout>
</template>

<script lang="ts" src="./ChatbotDefaultCommandWindow.vue.ts"></script>

<style <style lang="less" scoped>
@import '../../../../styles/index';
.modal-layout-content {
  margin-top: 45px;
}

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
}
</style>
