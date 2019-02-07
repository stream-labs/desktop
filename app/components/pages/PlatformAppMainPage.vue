<template>
<div>
  <div v-if="poppedOut">
    This app is currently popped out in another window.
  </div>
  <PlatformAppPageView v-else :appId="params.appId" :pageSlot="pageSlot" :key="params.appId" />
</div>
</template>

<script lang="ts" src="./PlatformAppMainPage.vue.ts"></script>
