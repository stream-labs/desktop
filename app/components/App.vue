<template>
<div>
  <top-nav></top-nav>
  <component :is="page">
  </component>
</div>
</template>

<script>
import TopNav from './TopNav.vue';

// Pages
import Studio from './pages/Studio.vue';
import Dashboard from './pages/Dashboard.vue';

export default {
  components: {
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
