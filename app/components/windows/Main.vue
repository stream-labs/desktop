<template>
<div class="main" :class="{'night-theme': nightTheme}">
  <div class="main-spacer bgColor-teal"></div>
  <top-nav></top-nav>
  <component class="main-page-container" :is="page">
  </component>
</div>
</template>

<script>
import TopNav from '../TopNav.vue';

// Pages
import Studio from '../pages/Studio.vue';
import Dashboard from '../pages/Dashboard.vue';
import Live from '../pages/Live.vue';
import Onboarding from '../pages/Onboarding.vue';
import windowMixin from '../mixins/window';
import { CustomizationService } from '../../services/customization';

const { remote } = window.require('electron');

export default {

  mixins: [windowMixin],

  components: {
    TopNav,
    Studio,
    Dashboard,
    Live,
    Onboarding
  },

  mounted() {
    remote.getCurrentWindow().setTitle(this.title);
  },

  data() {
    return {
      title: 'Streamlabs OBS - Version: ' + remote.process.env.SLOBS_VERSION
    };
  },

  computed: {
    page() {
      return this.$store.state.navigation.currentPage;
    },
    nightTheme() {
      return CustomizationService.instance.nightMode;
    }
  }
};
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
