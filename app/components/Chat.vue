<template>
  <webview
    class="chat"
    id="chatWebview"
    ref="chat"
    :src="chatUrl"
  >
  </webview>
</template>

<script lang="ts" src="./Chat.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';
.chat {
  .flex--grow();
  overflow: hidden; // webview content can affect external UI without this rule
}

.chat object {
  width: 100%;
}
</style>
