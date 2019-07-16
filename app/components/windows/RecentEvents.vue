<template>
<modal-layout
  :show-controls="false">
  <!-- <webview
    class="recent-events"
    slot="content"
    ref="webview"
    :src="recentEventsUrl">
  </webview> -->
  <browser-view
    slot="content"
    class="recent-events"
    :src="recentEventsUrl"
    :setLocale="true"
    @ready="onBrowserViewReady" />
</modal-layout>
</template>

<script lang="ts" src="./RecentEvents.vue.ts"></script>

<style lang="less" scoped>
.recent-events {
  height: 100%;
  width: 100%;
}
</style>
