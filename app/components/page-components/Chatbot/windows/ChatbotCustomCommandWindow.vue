<template>
<ModalLayout
  :showControls="false"
  :customControls="true"
>
  <div slot="fixed">
    <Tabs :tabs="tabs" :value="selectedTab" @input="onSelectTabHandler">
    </Tabs>
  </div>
  <div slot="content" class="chatbot-add-command__container">
    <transition name='fade' mode="out-in" appear>
      <validated-form ref="form">
        <div v-if="selectedTab === 'general'">
          <VFormGroup
            :title="$t('Command')"
            v-model="newCommand.command"
            :metadata="commandMetadata"
          />
          <VFormGroup
            :title="$t('Response')"
            v-model="newCommand.response"
            :metadata="responseMetadata"
          />
          <div class="row">
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('Permission')"
                v-model="newCommand.permission.level"
                :metadata="permissionMetadata"
              />
            </div>
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('Reply In')"
                v-model="newCommand.response_type"
                :metadata="replyTypeMetadata"
              />
            </div>
          </div>
        </div>
        <div v-if="selectedTab === 'advanced'">
          <div class="row">
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('Global Command Cooldown')"
                v-model="newCommand.cooldowns.global"
                :metadata="cooldownsMetadata"
              />
            </div>
            <div class="small-6 columns">
              <VFormGroup
                :title="$t('User Command Cooldown')"
                v-model="newCommand.cooldowns.user"
                :metadata="cooldownsMetadata"
              />
            </div>
          </div>
          <ChatbotAliases v-model="newCommand.aliases" />
        </div>
      </validated-form>
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
