<template>
  <browser-frame
    ref="appStoreWebview"
    v-if="loggedIn"
    class="app-store"
    id="appStoreWebview"
    :url="appStoreUrl"
    :partition="partition"
    affinity="streamlabs"
    preload="bundles/guest-api"
  />
</template>

<script lang="ts" src="./PlatformAppStore.vue.ts"></script>
