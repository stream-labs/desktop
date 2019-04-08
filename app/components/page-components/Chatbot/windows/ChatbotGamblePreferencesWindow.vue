<template>
  <ModalLayout :showControls="false" :customControls="true" :containsTabs="true">
    <div slot="fixed">
      <div class="window-toggle__wrapper">
        <div @click="onToggleGamblePreferencesWindowHandler">
          <span>{{ $t('Edit Primary Command') }}</span>
          <i class="fas fa-chevron-right window-toggle__icon"></i>
        </div>
      </div>
    </div>
    <validated-form ref="form" slot="content" class="chatbot-symbol-protection__container">
      <div class="section">
        <div class="section-content">
          <h2 class="section-title">{{$t('Loyalty')}}</h2>
          <div class="row">
            <div class="columns small-4">
              <VFormGroup
                :title="$t('Min Amount')"
                v-model="newGamblePreferences.settings.general.min"
                :metadata="metaData.min"
              />
            </div>
            <div class="columns small-4">
              <VFormGroup
                :title="$t('Max Amount')"
                v-model="newGamblePreferences.settings.general.max"
                :metadata="metaData.max"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-content">
          <h2 class="section-title">{{$t('Reward Multipliers')}}</h2>
          <div class="row">
            <div class="columns small-4">
              <VFormGroup
                title="1-25"
                v-model="newGamblePreferences.settings.general.range['1-25']"
                :metadata="metaData.range1"
              />
            </div>
            <div class="columns small-4">
              <VFormGroup
                title="26-50"
                v-model="newGamblePreferences.settings.general.range['26-50']"
                :metadata="metaData.range2"
              />
            </div>
            <div class="columns small-4">
              <VFormGroup
                title="51-75"
                v-model="newGamblePreferences.settings.general.range['51-75']"
                :metadata="metaData.range3"
              />
            </div>
          </div>
          <div class="row">
            <div class="columns small-4">
              <VFormGroup
                title="76-98"
                v-model="newGamblePreferences.settings.general.range['76-98']"
                :metadata="metaData.range4"
              />
            </div>
            <div class="columns small-4">
              <VFormGroup
                title="99-100"
                v-model="newGamblePreferences.settings.general.range['99-100']"
                :metadata="metaData.range5"
              />
            </div>
          </div>
        </div>
      </div>
    </validated-form>
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

<script lang="ts" src="./ChatbotGamblePreferencesWindow.vue.ts"></script>

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
  background-color: var(--background);
  z-index: 1;
  width: 100%;
  padding: 15px;
  padding-left: 0px;
  height: 48px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}
</style>
