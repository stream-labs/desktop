<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t(`${isEdit ? 'Edit' : 'Add'} Command`)"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-add-command__container">
    <transition name='fade' mode="out-in" appear>
      <div v-if="selectedTab === 'general'">
        <div>
          <label for="command" class="margin-vertical--10">Command</label>
          <TextInput
            v-model="newCommand.command"
            :metadata="commandMetadata"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10">Response</label>
          <TextAreaInput
            v-model="newCommand.response"
            :metadata="responseMetadata"
          />
        </div>
        <div class="row">
          <div class="small-6 columns">
            <label for="permission" class="margin-vertical--10">Permission</label>
            <ListInput
              v-model="newCommand.permission.level"
              :metadata="permissionMetadata"
            />
          </div>
          <div class="small-6 columns">
            <label for="reply in" class="margin-vertical--10">Reply In</label>
            <ListInput
              v-model="newCommand.response_type"
              :metadata="replyTypeMetadata"
            />
          </div>
        </div>
      </div>
      <div v-if="selectedTab === 'advanced'">
        <div class="row">
          <div class="small-5 columns">
            <label for="global_cooldown" class="margin-vertical--10">Global Command Cooldown in mins</label>
            <NumberInput
              v-model="newCommand.cooldowns.global"
              :metadata="cooldownsMetadata"
            />
          </div>
          <div class="small-5 columns">
            <label for="user_cooldown" class="margin-vertical--10">User Command Cooldown in mins</label>
            <NumberInput
              v-model="newCommand.cooldowns.user"
              :metadata="cooldownsMetadata"
            />
          </div>
        </div>
        <ChatbotAliases v-model="newCommand.aliases" />
      </div>
    </transition>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="onCancel">
      Cancel
    </button>
    <button
      class="button button--action"
      :disabled="!newCommand.command || !newCommand.response"
      @click="onSave"
    >
      {{ $t("Save") }}
    </button>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotCustomCommandWindow.vue.ts"></script>

<style <style lang="less" scoped>
.chatbot-add-command__container {
  padding-top: 45px;
}
</style>
