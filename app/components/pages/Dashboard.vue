<template>
  <browser-frame
    name="dashboardFrame"
    ref="dashboard"
    v-show="loggedIn"
    :url="dashboardUrl"
    :partition="partition"
    preload="bundles/guest-api"
    :openRemote="true"
    :requestHandler="requestHandler"
  />
</template>

<script lang="ts" src="./Dashboard.vue.ts"></script>