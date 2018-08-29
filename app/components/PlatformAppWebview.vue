<template>
<webview
  class="platform-app-webview"
  ref="appView"
  :src="appUrl"
  preload="bundles/guest-api" />
</template>

<script lang="ts" src="./PlatformAppWebview.vue.ts"></script>
