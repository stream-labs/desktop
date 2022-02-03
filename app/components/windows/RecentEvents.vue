<template>
  <modal-layout :show-controls="false">
    <browser-view
      slot="content"
      class="recent-events"
      :componentProps="{
        src: recentEventsUrl,
        setLocale: true,
        onReady: onBrowserViewReady,
      }"
    />
  </modal-layout>
</template>

<script lang="ts" src="./RecentEvents.vue.ts"></script>

<style lang="less" scoped>
.recent-events {
  height: 100%;
  width: 100%;
}
</style>
