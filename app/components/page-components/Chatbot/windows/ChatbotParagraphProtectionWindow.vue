<template>
  <ModalLayout :showControls="false" :customControls="true">
    <div slot="fixed">
      <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler"></Tabs>
    </div>
    <div slot="content" class="chatbot-paragraph-protection__container">
      <validated-form ref="form">
        <div v-show="selectedTab === 'general' && paragraphProtection">
          <div class="row">
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('Auto Permit')"
                v-model="paragraphProtection.general.excluded.level"
                :metadata="metadata.paragraph.general.excluded.level"
              />
            </div>
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('Punishment')"
                v-model="paragraphProtection.general.punishment.type"
                :metadata="metadata.paragraph.general.punishment.type"
              />
            </div>
          </div>
          <VFormGroup
            v-if="paragraphProtection.general.punishment.type === 'Timeout'"
            :title="$t('Punishment Duration')"
            v-model="paragraphProtection.general.punishment.duration"
            :metadata="metadata.paragraph.general.punishment.duration"
          />
          <VFormGroup
            :title="$t('Punishment Response')"
            v-model="paragraphProtection.general.message"
            :metadata="metadata.paragraph.general.message"
          />
        </div>
        <div v-show="selectedTab === 'advanced'">
          <VFormGroup
            :title="$t('Maximum Message Length')"
            v-model="paragraphProtection.advanced.maximum"
            :metadata="metadata.paragraph.advanced.maximum"
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

<script lang="ts" src="./ChatbotParagraphProtectionWindow.vue.ts"></script>

<style lang="less" scoped>
.chatbot-paragraph-protection__container {
  padding-top: 45px;
}
</style>
