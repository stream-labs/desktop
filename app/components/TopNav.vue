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
      :class="{ active: page === 'Dashboard' }" :disabled="!isUserLoggedIn">
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
      :class="{ active: page === 'Live' }" :disabled="!isUserLoggedIn">
      <i class="fa fa-list"/> Live
    </button>
  </div>

  <div class="top-nav-right">
    <div class="top-nav-item" v-if="isDevMode">
      <a @click="openDevTools">Dev Tools</a>
    </div>
    <div class="top-nav-item">
      <a @click="bugReport">Bug Report</a>
    </div>
    <div class="top-nav-item">
      <button @click="toggleNightTheme" class="theme-toggle">
          <i class="fa fa-sun-o"/>
          <i class="fa fa-moon-o"/>
      </button>
    </div>
    <div class="top-nav-item">
      <a
        @click="openSettingsWindow"
        class="link link--uppercase">
        <i class="fa fa-cog"/> Settings
      </a>
    </div>
    <div class="top-nav-item">
      <login/>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import { WindowService } from '../services/window';
import { CustomizationService } from '../services/customization';
import { NavigationService } from "../services/navigation";
import { UserService } from '../services/user';
import electron from '../vendor/electron';
import Login from './Login.vue';

@Component({
  components: { Login }
})
export default class TopNav extends Vue {

  windowService: WindowService = WindowService.instance;
  customizationService: CustomizationService = CustomizationService.instance;
  navigationService: NavigationService = NavigationService.instance;

  @Inject()
  userService: UserService;

  slideOpen = false;

  navigateStudio() {
    this.navigationService.navigate('Studio');
  }

  navigateDashboard() {
    this.navigationService.navigate('Dashboard');
  }

  navigateLive() {
    this.navigationService.navigate('Live');
  }

  navigateOnboarding() {
    this.navigationService.navigate('Onboarding');
  }

  openSettingsWindow() {
    this.windowService.showSettings();
  }

  toggleNightTheme() {
    this.customizationService.nightMode = !this.customizationService.nightMode;
  }

  bugReport() {
    electron.remote.shell.openExternal('https://docs.google.com/forms/d/e/1FAIpQLSf_UvkZU2vuIsNI4WKM_s2-_eRuDbFeLByr5zsY6YDQphMOZg/viewform?usp=sf_link')
  }

  get isDevMode() {
    return electron.remote.process.env.NODE_ENV !== 'production';
  }

  openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  get isUserLoggedIn() {
    return this.userService.isLoggedIn();
  }

}
</script>

<style lang="less" scoped>
@import "../styles/index";

.top-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 20px;
  position: relative;
  max-width:  none;
  background-color: @day-secondary;
  border-bottom: 1px solid @day-border;
}

.top-nav-right {
  flex-grow: 1;
  display: flex;
  text-align: right;
  justify-content: flex-end;
  align-items: center;
}

.top-nav-item {
  margin-left: 20px;
  display: flex;
  align-items: center;
}

.theme-toggle {
  .fa {
    overflow: hidden;
    position: relative;
  }

  .fa-sun-o {
    color: @yellow;
  }

  .fa-moon-o {
    display: none;
  }
}

.night-theme {
  .top-nav {
    background-color: @night-primary;
    border-color: @night-border;
  }

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

  .user__name {
    &:hover {
      color: @white;
    }
  }
}
</style>
