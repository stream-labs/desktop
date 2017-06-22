<template>
<div class="top-nav">
  <!--<button
      @click="navigateOnboarding"
      class="button button--action"
      :class="{ active: page === 'Onboarding' }">
      Onboarding
  </button>-->

  <div class="tabs">
    <button
      @click="navigateDashboard"
      class="tab-button"
      :class="{ active: page === 'Dashboard' }"
      disabled>
      <i class="fa fa-tachometer"/> Dashboard
    </button>
    <button
      @click="navigateStudio"
      class="tab-button"
      :class="{ active: page === 'Studio' }">
      <i class="fa fa-video-camera"/> Editor
    </button>
    <button
      @click="navigateLive"
      class="tab-button"
      :class="{ active: page === 'Live' }"
      disabled>
      <i class="fa fa-list"/> Live
    </button>
  </div>

  <div class="top-nav-right">
    <div class="top-nav-item">
      <a @click="bugReport">Bug Report</a>
    </div>
    <div class="top-nav-item">
      <button
        class="slide-open__open"
        @click="slideOpen = !slideOpen">
        <i class="fa fa-long-arrow-left" aria-hidden="true"></i> Test
      </button>
      <transition name="slide-fade">
        <div
          v-if="slideOpen"
          class="slide-open__menu">
          <a class="slide-open__close"
              @click="slideOpen = !slideOpen">
              <i class="fa fa-times" aria-hidden="true"></i>
          </a>
          <div class="button-container">
            <button class="button button--trans">Follow</button>
            <button class="button button--trans">Subscription</button>
            <button class="button button--trans">Donation</button>
            <button class="button button--trans">Hosting</button>
            <button class="button button--trans">Bit</button>
            <button class="button button--trans">Redemption</button>
          </div>
        </div>
      </transition>
    </div>
    <div class="top-nav-item">
      <button @click="toggleNightTheme" class="theme-toggle">
          <i class="fa fa-sun-o"/>
          <i class="fa fa-moon-o"/>
      </button>
    </div>
    <div class="top-nav-item">
      <button
        @click="openSettingsWindow">
        <i class="fa fa-cog"/>
      </button>
    </div>
    <div class="top-nav-item">
      <start-streaming-button />
    </div>
  </div>
</div>
</template>

<script>
import { WindowService } from '../services/window';
import StartStreamingButton from './StartStreamingButton.vue';
import { CustomizationService } from '../services/customization';
import electron from '../vendor/electron';

export default {
  components: {
    StartStreamingButton
  },

  data() {
    return {
      slideOpen: false,
      windowService: WindowService.instance
    };
  },

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

    navigateLive() {
      this.$store.dispatch({
        type: 'navigate',
        pageName: 'Live'
      });
    },

    navigateOnboarding() {
      this.$store.dispatch({
        type: 'navigate',
        pageName: 'Onboarding'
      });
    },

    openSettingsWindow() {
      this.windowService.showSettings();
    },

    toggleNightTheme() {
      CustomizationService.instance.nightMode = !CustomizationService.instance.nightMode;
    },

    bugReport() {
      electron.remote.shell.openExternal('https://docs.google.com/forms/d/e/1FAIpQLSf_UvkZU2vuIsNI4WKM_s2-_eRuDbFeLByr5zsY6YDQphMOZg/viewform?usp=sf_link')
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
@import "../styles/index";
.top-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 30px;
  position: relative;
  max-width:  none;
}

.top-nav-right {
  flex-grow: 1;
  display: flex;
  text-align: right;
  justify-content: flex-end;
  align-items: center;
}

.top-nav-item {
  margin-left: 10px;
  display: flex;
  align-items: center;
  .fa {
    color: @grey;
  }
}

.theme-toggle {
  .fa {
    overflow: hidden;
    position: relative;
  }
  .fa-sun-o {
    color: @yellow;
    // margin-right: 10px;
  }
  .fa-moon-o {
    display: none;
  }
}

.night-theme {
  .theme-toggle {
    .fa-sun-o {
      display: none;
    }
    .fa-moon-o {
      color: @white;
      opacity: 1;
      display: block;
    }
  }
}
</style>
