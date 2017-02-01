<template>
<div>
  <button @click="navigateStudio">
    Studio
  </button>
  <button @click="navigateDashboard">
    Dashboard
  </button>
  <component :is="page">
  </component>
</div>
</template>

<script>
import studio from './pages/Studio.vue';
import dashboard from './pages/Dashboard.vue';

export default {
  components: {
    studio,
    dashboard
  },

  methods: {
    navigateStudio() {
      this.$store.dispatch('navigate', 'studio');
    },

    navigateDashboard() {
      this.$store.dispatch('navigate', 'dashboard');
    }
  },

  computed: {
    page() {
      return this.$store.state.navigation.currentPage;
    }
  }
}
</script>
