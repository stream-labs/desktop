<template>
<div class="top-layout">
  <title-bar></title-bar>
  <div class="title-spacer bgColor-teal"></div>
  <top-nav></top-nav>
  <component :is="page">
  </component>
</div>
</template>

<script>
import TitleBar from './TitleBar.vue';
import TopNav from './TopNav.vue';

// Pages
import Studio from './pages/Studio.vue';
import Dashboard from './pages/Dashboard.vue';

export default {
  components: {
    TitleBar,
    TopNav,
    Studio,
    Dashboard
  },

  computed: {
    page() {
      return this.$store.state.navigation.currentPage;
    }
  }
}
</script>

<style lang="less" scoped>
.top-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.title-spacer {
  height: 4px;
}
</style>
