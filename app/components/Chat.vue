<template>
  <webview
    class="chat"
    id="recentEventsWebview"
    :src="chatUrl">
  </webview>
</template>

<script lang="ts" src="./Chat.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";
.chat {
  height: 100%;
}
</style>
