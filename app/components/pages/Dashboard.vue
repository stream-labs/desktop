<template>
<browser-frame ref="dashboard" v-show="loggedIn" :url="dashboardUrl" :partition="partition" preload="bundles/guest-api" :openRemote="true" affinity="streamlabs"/>
</template>

<script lang="ts" src="./Dashboard.vue.ts"></script>

<style lang="less" scoped>
.dashboard-container {
  position: absolute;
  top: -1px;
  right: 0;
  bottom: 0;
  left: 0;
}

.dashboard {
  position: absolute;
  top: -2px;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>

