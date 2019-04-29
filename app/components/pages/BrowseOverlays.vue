<template>
  <browser-frame
    ref="overlaysWebview"
    class="overlays"
    id="overlaysWebview"
    name='overlayFrame'
    :url="overlaysUrl"
    :partition="partition"
    preload="bundles/guest-api"
    :requestHandler="requestHandler"
    :openRemote="true"
  />
</template>

<script lang="ts" src="./BrowseOverlays.vue.ts"></script>
