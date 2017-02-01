<template>
<div>
  <div class="button-group">
    <button
      @click="navigateStudio"
      class="button button--default button--lg"
      :class="{ active: page === 'studio' }">
      Studio
    </button>
    <button
      @click="navigateDashboard"
      class="button button--default button--lg"
      :class="{ active: page === 'dashboard' }">
      Dashboard
    </button>
  </div>
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

<style lang="less" scoped>
.button {
  &:focus {
    outline: 0;
  }
}
</style>
