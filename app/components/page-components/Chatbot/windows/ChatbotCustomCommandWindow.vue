<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t(`${isEdit ? 'Edit' : 'Add'} Command`)"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-add-command__container">
    <transition name='fade' mode="out-in" appear>
      <div v-if="selectedTab === 'general'">
        <div>
          <label for="command" class="margin-vertical--10"> {{ $t('Command') }} </label>
          <TextInput
            v-model="newCommand.command"
            :metadata="commandMetadata"
          />
        </div>
        <div>
          <label for="response" class="margin-vertical--10"> {{ $t('Response (Line breaks will be ignored)') }} </label>
          <TextAreaInput
            v-model="newCommand.response"
            :metadata="responseMetadata"
          />
        </div>
        <div class="row">
          <div class="small-6 columns">
            <label for="permission" class="margin-vertical--10"> {{ $t('Permission') }} </label>
            <ListInput
              v-model="newCommand.permission.level"
              :metadata="permissionMetadata"
            />
          </div>
          <div class="small-6 columns">
            <label for="reply in" class="margin-vertical--10"> {{ $t('Reply In') }} </label>
            <ListInput
              v-model="newCommand.response_type"
              :metadata="replyTypeMetadata"
            />
          </div>
        </div>
      </div>
      <div v-if="selectedTab === 'advanced'">
        <div class="row">
          <div class="small-6 columns">
            <label for="global_cooldown" class="margin-vertical--10"> {{ $t('Global Command Cooldown (Value in Minutes)') }} </label>
            <NumberInput
              v-model="newCommand.cooldowns.global"
              :metadata="cooldownsMetadata"
            />
          </div>
          <div class="small-6 columns">
            <label for="user_cooldown" class="margin-vertical--10"> {{ $t('User Command Cooldown (Value in Minutes)') }} </label>
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
      @click="onCancelHandler">
      {{ $t('Cancel') }}
    </button>
    <button
      class="button button--action"
      :disabled="errors.items.length > 0 || !newCommand.command || !newCommand.response"
      @click="onSaveHandler"
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
