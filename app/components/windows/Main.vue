<template>
<div class="Main">
  <div class="Main-resizeSpacer"/>
  <title-bar
    :windowTitle="title"/>
  <div class="Main-spacer bgColor-teal"></div>
  <top-nav></top-nav>
  <component class="Main-pageContainer" :is="page">
  </component>
</div>
</template>

<script>
import TitleBar from '../TitleBar.vue';
import TopNav from '../TopNav.vue';

const { remote } = window.require('electron');

// Pages
import Studio from '../pages/Studio.vue';
import Dashboard from '../pages/Dashboard.vue';

import Obs from '../../api/Obs.js';

export default {
  components: {
    TitleBar,
    TopNav,
    Studio,
    Dashboard
  },

  data() {
    return {
      title: 'Streamlabs OBS - Version: ' + remote.process.env.SLOBS_VERSION
    };
  },

  computed: {
    page() {
      return this.$store.state.navigation.currentPage;
    }
  }
}
</script>

<style lang="less" scoped>
.Main {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.Main-resizeSpacer {
  height: 5px;
}

.Main-spacer {
  height: 4px;
}

.Main-pageContainer {
  /* Page always takes up remaining space */
  flex-grow: 1;
}
</style>
