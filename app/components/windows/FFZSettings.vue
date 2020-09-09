<template>
<modal-layout :show-controls="false">
  <div slot="content" class="ffz-settings">
    <webview
      class="ffz-settings-container"
      id="ffz-settings"
      ref="ffzSettings"
      :src="popoutURL"
      />
  </div>
</modal-layout>
</template>

<script lang="ts" src="./FFZSettings.vue.ts"></script>

<style lang="less">
.ffz-settings-container {
  width: 100%;
  height: 100%;
}
</style>