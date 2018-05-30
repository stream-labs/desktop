<template>
<modal-layout
  title="Recent Events"
  :show-controls="false">
  <div slot="content">
    <webview ref="webview" :src="recentEventsUrl"></webview>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./RecentEvents.vue.ts"></script>
