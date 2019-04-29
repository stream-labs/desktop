<template>
  <browser-frame
    ref="appStoreWebview"
    name="appStoreFrame"
    v-if="loggedIn"
    class="app-store"
    id="appStoreWebview"
    :url="appStoreUrl"
    :partition="partition"
    preload="bundles/guest-api"
    :requestHandler="requestHandler"
  />
</template>

<script lang="ts" src="./PlatformAppStore.vue.ts"></script>
