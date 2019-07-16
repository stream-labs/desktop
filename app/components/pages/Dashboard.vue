<template>
<div>
  <browser-view
    class="dashboard"
    :src="dashboardUrl"
    :enableGuestApi="true"
    @ready="onBrowserViewReady"/>
</div>
</template>

<script lang="ts" src="./Dashboard.vue.ts"></script>

<style lang="less" scoped>

.dashboard {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>

