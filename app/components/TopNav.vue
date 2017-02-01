<template>
<div class="button-group">
  <button
    @click="navigateStudio"
    class="button button--default button--lg"
    :class="{ active: page === 'Studio' }">
    Studio
  </button>
  <button
    @click="navigateDashboard"
    class="button button--default button--lg"
    :class="{ active: page === 'Dashboard' }">
    Dashboard
  </button>
</div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {

  methods: {
    navigateStudio() {
      this.$store.dispatch('navigate', 'Studio');
    },

    navigateDashboard() {
      this.$store.dispatch('navigate', 'Dashboard');
    }
  },

  computed: {
    page() {
      return this.$store.state.navigation.currentPage;
    }
  }

};
</script>
