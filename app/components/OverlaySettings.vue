<template>
<div class="section">
  This is an experimental feature.  Use at your own risk.
  <br/>
  <br/>
  <button
    class="button button--action"
    :disabled="busy"
    @click="saveOverlay">
    Export Overlay
    <i class="fa fa-spinner fa-pulse" v-if="busy" />
  </button>
  <button
    class="button button--action"
    :disabled="busy"
    @click="loadOverlay">
    Import Overlay
    <i class="fa fa-spinner fa-pulse" v-if="busy" />
  </button>
  <br/>
  {{ message }}
</div>
</template>

<script lang="ts" src="./OverlaySettings.vue.ts"></script>
