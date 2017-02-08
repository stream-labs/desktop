<template>
<div class="topNav">
  <div class="button-group no-margin">
    <button
      @click="navigateStudio"
      class="button button--default button--md"
      :class="{ active: page === 'Studio' }">
      Studio
    </button>
    <button
      @click="navigateDashboard"
      class="button button--default button--md"
      :class="{ active: page === 'Dashboard' }">
      Dashboard
    </button>
  </div>
  <div class="topNav-rightButtons">
  <button
    class="button button--default button--md"
    @click="openSettingsWindow">
    Settings
  </button>
  </div>
</div>
</template>

<script>
import windowManager from '../util/WindowManager.js';

export default {

  methods: {
    navigateStudio() {
      this.$store.dispatch({
        type: 'navigate',
        pageName: 'Studio'
      });
    },

    navigateDashboard() {
      this.$store.dispatch({
        type: 'navigate',
        pageName: 'Dashboard'
      });
    },

    openSettingsWindow() {
      windowManager.showSettings();
    }
  },

  computed: {
    page() {
      return this.$store.state.navigation.currentPage;
    }
  }

};
</script>

<style lang="less" scoped>
.topNav {
  display: flex;
  flex-direction: row;
  align-items: center;

  padding: 20px 40px;
}

.topNav-rightButtons {
  flex-grow: 1;
  text-align: right;
}
</style>
