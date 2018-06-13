<template>
<modal-layout
  title="Bit Goal Settings"
  :customControls="true"
  :showControls="false">

  <div slot="content">
    <div v-if="widgetData">

      <webview :src="widgetUrl"></webview>

    </div>

    <div v-else>
      <img src="../../../media/images/loader.svg" />
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./ChatBox.vue.ts"></script>
