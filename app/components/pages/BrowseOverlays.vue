<template>
  <browser-frame
    ref="overlaysWebview"
    class="overlays"
    id="overlaysWebview"
    name='overlayFrame'
    :url="overlaysUrl"
    :partition="partition"
    affinity="streamlabs"
    preload="bundles/guest-api"
  />
</template>

<script lang="ts" src="./BrowseOverlays.vue.ts"></script>
