<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Word Protection Preferences')"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-word-protection__container">
    <transition name='fade' mode="out-in" appear>
      <validated-form ref="form" v-if="selectedTab === 'general' && wordProtection">
        <VFormGroup
          :title="$t('Auto Permit')"
          v-model="wordProtection.general.excluded.level"
          :metadata="metadata.word.general.excluded.level"
        />
        <VFormGroup
          :title="$t('Punishment Message')"
          v-model="wordProtection.general.message"
          :metadata="metadata.word.general.message"
        />
      </validated-form>
      <div v-if="selectedTab === 'blacklist'">
        <ChatbotWordProtectionList
          v-model="wordProtection.blacklist"
        />
      </div>
    </transition>
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
      >
        {{ $t("Save") }}
      </button>
    </div>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotWordProtectionWindow.vue.ts"></script>

<style lang="less" scoped>
.chatbot-word-protection__container {
  padding-top: 45px;
}
</style>
