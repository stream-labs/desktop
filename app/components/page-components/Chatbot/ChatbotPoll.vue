<template>
  <div>
    <!-- batch actions -->
    <div class="flex flex--space-between padding--10">
      <button
        class="button button--action margin--10 button--add-command"
      >{{ $t('Add Betting Profile') }}</button>
      <button class="button button--default margin--10">{{ $t('Betting Preferences') }}</button>
    </div>
    <!-- profiles -->
    <ChatbotPollProfile v-for="profile in profiles" :key="profile.title" :profile="profile"/>
  </div>
</template>

<script lang='ts' src="./ChatbotPoll.vue.ts"></script>

<style lang="less" scoped>
@import '../../../styles/index';
</style>
