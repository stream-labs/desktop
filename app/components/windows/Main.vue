<template>
<div class="Main">
  <div class="Main-spacer bgColor-teal"></div>
  <top-nav></top-nav>
  <component class="Main-pageContainer" :is="page">
  </component>
</div>
</template>

<script>
import TopNav from '../TopNav.vue';

// Pages
import Studio from '../pages/Studio.vue';
import Dashboard from '../pages/Dashboard.vue';
import windowMixin from '../mixins/window';

const { remote } = window.require('electron');

export default {

  mixins: [windowMixin],

  components: {
    TopNav,
    Studio,
    Dashboard
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

.Main-spacer {
  height: 4px;
}

.Main-pageContainer {
  /* Page always takes up remaining space */
  flex-grow: 1;
}
</style>
