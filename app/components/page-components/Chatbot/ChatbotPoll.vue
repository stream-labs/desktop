<template>
  <div>
    <ChatbotActivePoll v-if="isPollActive"/>
    <div class="chatbot-poll__container" v-else>
      <!-- batch actions -->
      <div class="flex flex--space-between padding--10">
        <button
          class="button button--action margin--10 button--add-command"
          @click="onOpenProfileHandler"
        >{{ $t('Add Poll Profile') }}</button>
        <button class="button button--default margin--10"
        @click="onOpenPollPreferencesHandler">{{ $t('Poll Preferences') }}</button>
      </div>
      <!-- profiles -->
      <div class="chatbot-profile__container">
        <ChatbotPollProfile
          v-if="profiles"
          v-for="profile in profiles"
          :key="profile.title"
          :profile="profile"
        />
      </div>
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotPoll.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';
.chatbot-profile__container {
  .margin-horizontal--10;
}
</style>
