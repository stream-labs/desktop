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
      <a class="link" @click="openDevTools">Dev Tools</a>
    </div>
    <div class="top-nav-item">
      <a class="link" @click="bugReport">Bug Report</a>
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

<script lang="ts" src="./TopNav.vue.ts"></script>

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
  flex: 0 0 45px;
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

  @media(max-width: 1200px) {
    font-size: 12px;
  }
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
