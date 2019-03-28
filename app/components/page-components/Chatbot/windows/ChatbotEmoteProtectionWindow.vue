<template>
  <ModalLayout :showControls="false" :customControls="true">
    <div slot="fixed">
      <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
    </div>
    <div slot="content" class="chatbot-emote-protection__container">
      <validated-form ref="form">
        <div v-show="selectedTab === 'general' && emoteProtection">
          <div class="row">
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('Auto Permit')"
                v-model="emoteProtection.general.excluded.level"
                :metadata="metadata.emote.general.excluded.level"
              />
            </div>
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('Punishment')"
                v-model="emoteProtection.general.punishment.type"
                :metadata="metadata.emote.general.punishment.type"
              />
            </div>
          </div>
          <VFormGroup
            v-if="emoteProtection.general.punishment.type === 'Timeout'"
            :title="$t('Punishment Duration')"
            v-model="emoteProtection.general.punishment.duration"
            :metadata="metadata.emote.general.punishment.duration"
          />
          <VFormGroup
            :title="$t('Punishment Response')"
            v-model="emoteProtection.general.message"
            :metadata="metadata.emote.general.message"
          />
        </div>
        <div v-show="selectedTab === 'advanced'">
          <VFormGroup
            :title="$t('Minimum Amount of Emotes')"
            v-model="emoteProtection.advanced.minimum"
            :metadata="metadata.emote.advanced.minimum"
          />
          <VFormGroup
            :title="$t('Maximum Amount of Emotes')"
            v-model="emoteProtection.advanced.maximum"
            :metadata="metadata.emote.advanced.maximum"
          />
          <VFormGroup
            v-if="selectedTab === 'advanced'"
            :title="$t('Maximum Percent')"
            v-model="emoteProtection.advanced.percent"
            :metadata="metadata.emote.advanced.percent"
          />
        </div>
      </validated-form>
    </div>
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

<script lang="ts" src="./ChatbotEmoteProtectionWindow.vue.ts"></script>

<style lang="less" scoped>
.chatbot-emote-protection__container {
  padding-top: 45px;
}
</style>
