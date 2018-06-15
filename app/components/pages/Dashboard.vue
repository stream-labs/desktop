<template>
<div>
  <div class="dashboard-container">
    <webview
      class="dashboard"
      v-show="loggedIn"
      id="dashboardWebview"
      :src="dashboardUrl"
      ref="dashboard"
      preload="bundles/guest-api">
    </webview>
    <!-- <p v-else>User Not Logged In, Display something here????</p> -->
  </div>
</div>
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

