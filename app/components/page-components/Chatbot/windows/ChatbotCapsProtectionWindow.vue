<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Caps Protection Preferences')"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-caps-protection__container">
    <div v-if="selectedTab === 'general' && capsProtection">
      <div class="row">
        <div class="small-6 columns">
          <label for="excluded" class="margin-vertical--10">Auto Permit</label>
          <ListInput
            v-model="capsProtection.general.excluded.level"
            :metadata="metadata.general.excluded.level"
          />
        </div>
        <div class="small-6 columns">
          <label for="show to" class="margin-vertical--10">Punishment</label>
          <ListInput
            v-model="capsProtection.general.punishment.type"
            :metadata="metadata.general.punishment.type"
          />
        </div>
      </div>
      <div>
        <label for="response" class="margin-vertical--10">Punishment Duration</label>
        <NumberInput
          v-model="capsProtection.general.punishment.duration"
          :metadata="metadata.general.punishment.duration"
        />
      </div>
      <div>
        <label for="response" class="margin-vertical--10">Punishment Response</label>
        <TextAreaInput
          v-model="capsProtection.general.message"
          :metadata="metadata.general.message"
        />
      </div>
    </div>
    <div v-if="selectedTab === 'advanced'">
      Advanced Stuff
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

<script lang="ts" src="./ChatbotCapsProtectionWindow.vue.ts"></script>

<style <style lang="less" scoped>
.chatbot-caps-protection__container {
  padding-top: 45px;
}
</style>
