<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Add Command')"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-add-command__container">
    <div v-if="selectedTab === 'general'">
      <div>
        <label for="command" class="margin-vertical--10">Command</label>
        <WTextInput
          v-model="newCommand.command"
          :metadata="commandMetadata"
        />
      </div>
      <div>
        <label for="response" class="margin-vertical--10">Response</label>
        <WTextAreaInput
          v-model="newCommand.response"
          :metadata="responseMetadata"
        />
      </div>
      <div>
        <div class="small-6 columns">
          <label for="permission" class="margin-vertical--10">Permission</label>
          <WListInput
            v-model="newCommand.permission.level"
            :metadata="permissionMetadata"
          />
        </div>
        <div class="small-6 columns">
          <label for="show to" class="margin-vertical--10">Show to</label>
          <WListInput
            v-model="newCommand.response_type"
            :metadata="showToMetadata"
          />
        </div>
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
      <!-- <i class="fa fa-spinner fa-pulse" v-if="updatingInfo" /> -->
      Save
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotCommandWindow.vue.ts"></script>

<style <style lang="less" scoped>
.chatbot-add-command__container {
  padding-top: 45px;
}
</style>
