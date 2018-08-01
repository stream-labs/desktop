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
  <div slot="content" class="chatbot-add-command__container">
    <div v-if="selectedTab === 'general'">
      <div class="row">
        <div class="small-6 columns">
          <label for="permission" class="margin-vertical--10">Auto Permit</label>
          <!-- <ListInput
            v-model="newCommand.permission.level"
            :metadata="permissionMetadata"
          /> -->
        </div>
        <div class="small-6 columns">
          <label for="show to" class="margin-vertical--10">Punishment</label>
          <!-- <ListInput
            v-model="newCommand.response_type"
            :metadata="showToMetadata"
          /> -->
        </div>
      </div>
      <div>
        <label for="response" class="margin-vertical--10">Punishment Response</label>
        <!-- <TextAreaInput
          v-model="newCommand.response"
          :metadata="responseMetadata"
        /> -->
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
.chatbot-add-command__container {
  padding-top: 45px;
}
</style>
