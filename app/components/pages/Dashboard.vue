<template>
<div>
  <div class="dashboard-container">
    <webview class="dashboard" v-show="loggedIn" id="dashboardWebview" :src="dashboardUrl"></webview>
    <!-- <p v-else>User Not Logged In, Display something here????</p> -->
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import SceneSelector from '../SceneSelector.vue';
import SourceSelector from '../SourceSelector.vue';
import { UserService } from '../../services/user';
import { Inject } from '../../services/service';

@Component({
  components: {
    SceneSelector,
    SourceSelector,
  }
})
export default class Dashboard extends Vue {
  @Inject()
  userService: UserService;

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

  get dashboardUrl() {
    return this.userService.widgetUrl('dashboard');
  }
}
</script>

<style lang="less" scoped>
.dashboard-container {
  position: absolute;
  top: 0px;
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

