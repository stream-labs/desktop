<template>
<div class="topLayout">
  <title-bar
    :windowTitle="title"/>
  <div class="topLayout-spacer bgColor-teal"></div>
  <top-nav></top-nav>
  <component class="pageContainer" :is="page">
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

  created() {
    this.$store.dispatch('initTestData');
  },

  computed: {
    page() {
      return this.$store.state.navigation.currentPage;
    }
  }
}
</script>

<style lang="less" scoped>
.topLayout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.topLayout-spacer {
  height: 4px;
}

.pageContainer {
  /* Page always takes up remaining space */
  flex-grow: 1;
}
</style>
