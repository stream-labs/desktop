<template>
  <div class="chat" ref="chat" />
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
