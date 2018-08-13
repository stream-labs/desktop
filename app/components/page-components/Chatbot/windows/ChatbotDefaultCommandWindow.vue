<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
  :title="$t('Edit Command')"
>
  <div slot="fixed">
    <div class="row">
      <div class="small-6 columns position--relative">
        <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTab"></Tabs>
      </div>
      <div class="small-6 columns position--relative">
        <div class="window-toggle__wrapper">
          <div
            @click="toggleLinkProtectionWindow"
            v-if="isLinkProtectionPermitCommand"
          >
            <span class="text-transform--uppercase"> {{ $t('link protection preferences') }} </span>
            <i class="icon-transition window-toggle__icon"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="editedCommand"
    slot="content"
    class="chatbot-add-command__container"
  >
    <transition name='fade' mode="out-in" appear>
      <div v-if="selectedTab === 'general'">
        <div>
          <label for="command" class="margin-vertical--10">Command</label>
          <TextInput
            v-model="editedCommand.command"
            :metadata="metadata.command"
          />
        </div>
        <div v-if="defaultCommandToUpdate.response">
          <label for="response" class="margin-vertical--10">Response</label>
          <TextAreaInput
            v-model="editedCommand.response"
            :metadata="metadata.response"
          />
        </div>
        <div v-if="defaultCommandToUpdate.success_response">
          <label for="success_response" class="margin-vertical--10">Success Response</label>
          <TextAreaInput
            v-model="editedCommand.success_response"
            :metadata="metadata.success_response"
          />
        </div>
        <div v-if="defaultCommandToUpdate.failed_response">
          <label for="failed_response" class="margin-vertical--10">Failed Response</label>
          <TextAreaInput
            v-model="editedCommand.failed_response"
            :metadata="metadata.failed_response"
          />
        </div>
        <div v-if="defaultCommandToUpdate.enabled_response">
          <label for="enabled_response" class="margin-vertical--10">Enabled Response</label>
          <TextAreaInput
            v-model="editedCommand.enabled_response"
            :metadata="metadata.enabled_response"
          />
        </div>
        <div v-if="defaultCommandToUpdate.disabled_response">
          <label for="disabled_response" class="margin-vertical--10">Disabled Response</label>
          <TextAreaInput
            v-model="editedCommand.disabled_response"
            :metadata="metadata.disabled_response"
          />
        </div>
        <div v-if="defaultCommandToUpdate.response_type">
          <label for="reply in" class="margin-vertical--10">Reply in</label>
          <ListInput
            v-model="editedCommand.response_type"
            :metadata="metadata.response_type"
          />
        </div>
      </div>
      <div v-if="selectedTab === 'advanced'">
        <ChatbotAliases v-model="editedCommand.aliases" />
      </div>
    </transition>
  </div>
  <div slot="controls" class="flex flex--space-between">
    <button class="button button--default" @click="resetCommand">
      {{ $t('Reset Command') }}
    </button>
    <div>
      <button class="button button--default" @click="onCancel">
        {{ $t('Cancel') }}
      </button>
      <button class="button button--action" @click="onSave">
        {{ $t("Save") }}
      </button>
    </div>
  </div>
</ModalLayout>
</template>

<script lang="ts" src="./ChatbotDefaultCommandWindow.vue.ts"></script>

<style <style lang="less" scoped>
@import "../../../../styles/index";
.chatbot-add-command__container {
  padding-top: 45px;
}

.window-toggle__wrapper {
  background-color: @day-primary;
  z-index: 1;
  width: 100%;
  padding: 15px;
  height: 54px;
  border-bottom: 1px solid @day-border;
  cursor: pointer;
  text-align: right;

  .window-toggle__icon {
    .margin-left();
  }
}

.night-theme {
  .window-toggle__wrapper {
    background-color: @night-primary;
    border-color: @night-border;
  }
}
</style>
