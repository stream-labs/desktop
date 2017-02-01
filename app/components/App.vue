<template>
  <div>
    <title-bar></title-bar>
    <div class="title-spacer"></div>
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
  .title-spacer {
    height: 4px;
    background-color: #32c3a2;
  }
</style>
