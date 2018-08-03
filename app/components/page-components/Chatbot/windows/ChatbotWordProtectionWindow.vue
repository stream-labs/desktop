<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Word Protection Preferences')"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-word-protection__container">
    <div v-if="selectedTab === 'general' && wordProtection">
      <div class="row">
        <label for="excluded" class="margin-vertical--10">Auto Permit</label>
        <ListInput
          v-model="wordProtection.general.excluded.level"
          :metadata="metadata.word.general.excluded.level"
        />
      </div>
      <div>
        <label for="message" class="margin-vertical--10">Punishment Message</label>
        <TextAreaInput
          v-model="wordProtection.general.message"
          :metadata="metadata.word.general.message"
        />
      </div>
    </div>
    <div v-if="selectedTab === 'blacklist'">
      blacklist Stuff
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

<script lang="ts" src="./ChatbotWordProtectionWindow.vue.ts"></script>

<style <style lang="less" scoped>
.chatbot-word-protection__container {
  padding-top: 45px;
}
</style>
