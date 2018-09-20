<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Link Protection Preferences')"
>
  <div slot="fixed">
    <div class="row">
      <div class="small-6 columns position--relative window-tab">
        <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
      </div>
      <div class="small-6 columns position--relative window-tab">
        <div class="window-toggle__wrapper">
          <div @click="onToggleLinkProtectionWindowHandler">
            <span> {{ $t('Edit Command') }} </span>
            <i class="fas fa-chevron-right window-toggle__icon"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div slot="content" class="chatbot-link-protection__container">
    <div>
      <transition name='fade' mode="out-in" appear>
        <div v-if="selectedTab === 'general' && linkProtection">
          <div class="row">
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('Auto Permit')"
                v-model="linkProtection.general.excluded.level"
                :metadata="metadata.link.general.excluded.level"
              />
            </div>
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('Punishment')"
                v-model="linkProtection.general.punishment.type"
                :metadata="metadata.link.general.punishment.type"
              />
            </div>
          </div>
          <VFormGroup
            :title="$t('Permit Duration (Value in Seconds)')"
            v-model="linkProtection.general.permit.duration"
            :metadata="metadata.link.general.permit.duration"
          />
          <VFormGroup
            v-if="linkProtection.general.punishment.type === 'Timeout'"
            :title="$t('Punishment Duration (Value in Seconds)')"
            v-model="linkProtection.general.punishment.duration"
            :metadata="metadata.link.general.punishment.duration"
          />
          <VFormGroup
            :title="$t('Punishment Response (Line breaks will be ignored)')"
            v-model="linkProtection.general.message"
            :metadata="metadata.link.general.message"
          />
        </div>
        <ChatbotLinkProtectionList
          v-if="selectedTab === 'whitelist' || selectedTab === 'blacklist'"
          :title="selectedTab === 'whitelist' ? $t('Add to whitelist') : $t('Add to blacklist')"
          :type="selectedTab"
          v-model="linkProtection[selectedTab]"
        />
        <!-- <div v-if="selectedTab === 'whitelist'">
          <ChatbotLinkProtectionList
            :title="$t('Add to Whitelist')"
            :type="'whitelist'"
            v-model="linkProtection.whitelist"
          />
        </div>
        <div v-if="selectedTab === 'blacklist'">
          <ChatbotLinkProtectionList
            :title="$t('Add to Blacklist')"
            :type="'blacklist'"
            v-model="linkProtection.blacklist"
          />
        </div> -->
      </transition>
    </div>
  </div>
  <div slot="controls" class="flex flex--space-between">
    <button
      class="button button--default"
      @click="onResetHandler">
      {{ $t('Reset') }}
    </button>
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

<script lang="ts" src="./ChatbotLinkProtectionWindow.vue.ts"></script>

<style <style lang="less" scoped>
@import "../../../../styles/index";
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
  height: 54px;
  border-bottom: 1px solid @day-border;
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}

.chatbot-link-protection__container {
  padding-top: 45px;
}

.night-theme {
  .window-toggle__wrapper {
    background-color: @night-primary;
    border-color: @night-border;
  }
}
</style>
