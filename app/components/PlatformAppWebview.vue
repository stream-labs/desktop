<template>
<webview
  v-if="renderWebview"
  class="platform-app-webview"
  ref="appView"
  :src="appUrl"
  :partition="appPartition"
  preload="bundles/guest-api" />
</template>

<script lang="ts" src="./PlatformAppWebview.vue.ts"></script>
