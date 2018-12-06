<template>
  <webview
    class="chat"
    id="recentEventsWebview"
    ref="chat"
    :src="chatUrl"
  >
  </webview>
</template>

<script lang="ts" src="./Chat.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';
.chat {
  position: absolute;
  width: 100%;
  height: 100%;
}

.chat object {
  width: 100%;
}
</style>
