<template>
  <div>
    <ChatbotActivePoll :type="'betting'" v-if="isPollActive"/>
    <div class="chatbot-poll__container" v-else>
      <!-- batch actions -->
      <div class="flex flex--space-between padding--10">
        <button
          class="button button--action margin--10 button--add-command"
          @click="onOpenProfileHandler"
        >{{ $t('Add Betting Profile') }}</button>
        <button class="button button--default margin--10"
        @click="onOpenBettingPreferencesHandler">{{ $t('Betting Preferences') }}</button>
      </div>
      <!-- profiles -->
      <div class="chatbot-profile__container"  v-if="profiles">
        <ChatbotPollProfile
          v-for="profile in profiles"
          :key="profile.title"
          :profile="profile"
          :type="'betting'"
        />
      </div>
    </div>
  </div>
</template>

<script lang='ts' src="./ChatbotBetting.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';
.chatbot-profile__container {
  .margin-horizontal--10;
}
</style>
