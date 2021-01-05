<template>
  <browser-view
    class="chatbot"
    :src="chatbotUrl"
    :options="{ webPreferences: { nativeWindowOpen: true, partition: 'chatbot' } }" />
</template>

<script lang='ts' src="./Chatbot.vue.ts"></script>

<style lang="less" scoped>
  .chatbot {
    width: 100%;
  }
</style>
