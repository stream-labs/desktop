<template>
<div class="main" :class="{'night-theme': nightTheme}">
  <div class="main-spacer bgColor-teal"></div>
  <top-nav></top-nav>
  <component class="main-page-container" :is="page">
  </component>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import TopNav from '../TopNav.vue';

// Pages
import Studio from '../pages/Studio.vue';
import Dashboard from '../pages/Dashboard.vue';
import Live from '../pages/Live.vue';
import Onboarding from '../pages/Onboarding.vue';
import windowMixin from '../mixins/window';
import { Inject } from '../../services/service';
import { CustomizationService } from '../../services/customization';
import { NavigationService } from '../../services/navigation';
import electron from '../../vendor/electron';

const { remote } = electron;

@Component({
  mixins: [windowMixin],
  components: {
    TopNav,
    Studio,
    Dashboard,
    Live,
    Onboarding
  }
})
export default class Main extends Vue {

  title = `Streamlabs OBS - Version: ${remote.process.env.SLOBS_VERSION}`;

  @Inject()
  customizationService: CustomizationService;

  @Inject()
  navigationService: NavigationService;

  mounted() {
    remote.getCurrentWindow().setTitle(this.title);
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  get nightTheme() {
    return this.customizationService.nightMode;
  }
}
</script>

<style lang="less" scoped>
@import "../../styles/index";

.main {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-spacer {
  height: 4px;
}

.main-page-container {
  /* Page always takes up remaining space */
  flex-grow: 1;
}
</style>
