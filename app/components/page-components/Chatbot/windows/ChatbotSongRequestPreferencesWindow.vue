
<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Link Protection Preferences')"
>
  <div slot="fixed">
    <div class="row">
      <div class="small-6 columns position--relative">
        <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
      </div>
      <div class="small-6 columns position--relative">
        <div class="window-toggle__wrapper">
          <!-- <div @click="onToggleLinkProtectionWindowHandler"> -->
          <div>
            <span> {{ $t('Edit Primary Command') }} </span>
            <i class="fas fa-chevron-right window-toggle__icon"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div slot="content" class="chatbot-song-request__container">
    <div>
      <transition name='fade' mode="out-in" appear>
        <div v-if="selectedTab === 'general'">
          <VFormGroup
            :title="$t('Max Duration (Value in Seconds)')"
            v-model="settings.advanced_settings.max_duration"
            :metadata="metadata.advanced_settings.max_duration"
          />
          <VFormGroup
            :title="$t('Spam Security')"
            v-model="settings.advanced_settings.security"
            :metadata="metadata.advanced_settings.security"
          />
        </div>
        <div v-else>
          Blacklist stuff
        </div>
      </transition>
    </div>
  </div>
  <div slot="controls" class="flex flex--space-between">
    <div>
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
        {{ $t("Save") }}
      </button>
    </div>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotSongRequestPreferencesWindow.vue.ts"></script>

<style <style lang="less" scoped>
@import "../../../../styles/index";

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

.chatbot-song-request__container {
  padding-top: 45px;
}

.night-theme {
  .window-toggle__wrapper {
    background-color: @night-primary;
    border-color: @night-border;
  }
}
</style>
