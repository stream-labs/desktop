<template>
<modal-layout
  :show-controls="false">
  <webview
    class="recent-events"
    slot="content"
    ref="webview"
    :src="recentEventsUrl">
  </webview>
</modal-layout>
</template>

<script lang="ts" src="./RecentEvents.vue.ts"></script>

<style lang="less" scoped>
.recent-events {
  height: 100%;
}
</style>
