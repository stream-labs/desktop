<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Link Protection Preferences')"
>
  <div slot="fixed">
    <div class="row">
      <div class="small-6 columns position--relative">
        <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab"></Tabs>
      </div>
      <div class="small-6 columns position--relative">
        <div class="window-toggle__wrapper">
          <div @click="toggleLinkProtectionWindow">
            <span class="text-transform--uppercase"> {{ $t('edit command') }} </span>
            <i class="icon-transition window-toggle__icon"></i>
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
              <label for="excluded" class="margin-vertical--10">Auto Permit</label>
              <ListInput
                v-model="linkProtection.general.excluded.level"
                :metadata="metadata.link.general.excluded.level"
              />
            </div>
            <div class="small-6 columns">
              <label for="show to" class="margin-vertical--10">Punishment</label>
              <ListInput
                v-model="linkProtection.general.punishment.type"
                :metadata="metadata.link.general.punishment.type"
              />
            </div>
          </div>
          <div>
            <label for="response" class="margin-vertical--10">Punishment Duration</label>
            <NumberInput
              v-model="linkProtection.general.punishment.duration"
              :metadata="metadata.link.general.punishment.duration"
            />
          </div>
          <div>
            <label for="response" class="margin-vertical--10">Punishment Response</label>
            <TextAreaInput
              v-model="linkProtection.general.message"
              :metadata="metadata.link.general.message"
            />
          </div>
        </div>
        <div v-if="selectedTab === 'whitelist'">
          <ChatbotLinkProtectionList
            :title="'Add to Whitelist'"
            v-model="linkProtection.whitelist"
          />
        </div>
        <div v-if="selectedTab === 'blacklist'">
          <ChatbotLinkProtectionList
            :title="'Add to Blacklist'"
            v-model="linkProtection.blacklist"
          />
        </div>
      </transition>
    </div>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="onCancel">
      Cancel
    </button>
    <button
      class="button button--action"
      @click="onSave"
    >
      {{ $t("Save") }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotLinkProtectionWindow.vue.ts"></script>

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
