<template>
<div class="top-nav" ref="top_nav" :class="{ 'loading': loading, 'top-nav--compact': responsiveClass }">
  <!--<button
      @click="navigateOnboarding"
      class="button button--action"
      :class="{ active: page === 'Onboarding' }">
      Onboarding
  </button>-->

  <resize-observer @notify="handleResize"></resize-observer>

  <div class="tabs">
    <button
      @click="navigateDashboard"
      class="tab-button"
      :class="{ active: page === 'Dashboard' }"
      :disabled="!isUserLoggedIn || locked">
      <i class="icon-dashboard"/> <span class="tab-button__text">{{ $t('Dashboard') }}</span>
    </button>
    <button
      @click="navigateChatBot"
      class="tab-button"
      v-if="featureIsEnabled(availableFeatures.chatbot) && chatbotVisible"
      :class="{ active: page === 'Chatbot'}"
      :disabled="!isUserLoggedIn || locked">
      <i class="icon-community"/> <span class="tab-button__text">{{ $t('Cloudbot') }}</span>
    </button>
    <button
      v-if="appStoreVisible"
      @click="navigatePlatformAppStore"
      class="tab-button"
      :class="{ 'is-active': page === 'PlatformAppStore' }"
      :disabled="!isUserLoggedIn || locked">
      <i class="icon-store"/> <span class="tab-button__text">{{ $t('App Store') }}</span>
      <span class="badge badge--new">{{ $t('New') }}</span>
    </button>
    <button
      @click="navigateOverlays"
      class="tab-button"
      :class="{ 'is-active': page === 'BrowseOverlays' }"
      :disabled="!isUserLoggedIn || locked">
      <i class="icon-themes"/> <span class="tab-button__text">{{ $t('Themes') }}</span>
    </button>
    <button
      @click="navigateStudio"
      class="tab-button"
      :class="{ 'is-active': page === 'Studio' }"
      :disabled="locked">
      <i class="icon-studio"/> <span class="tab-button__text">{{ $t('Editor') }}</span>
    </button>
    <button
      @click="navigateLive"
      class="tab-button"
      :class="{ 'is-active': page === 'Live' }"
      :disabled="!isUserLoggedIn || locked">
      <i class="icon-live-dashboard"/> <span class="tab-button__text">{{ $t('Live') }}</span>
    </button>
  </div>

  <div class="top-nav-right">
    <undo-controls class="top-nav-item" />
    <div class="top-nav-item">
      <button @click="toggleNightTheme" class="theme-toggle">
        <div class="theme-toggle__bg"></div>
        <img
          class="theme-toggle__icon"
          :class="{ active: customizationService.currentTheme === 'night-theme' }"
          v-tooltip.right="moonTooltip"
          :src="modeToggleIcon"
        />
      </button>
    </div>
    <div class="top-nav-item" v-if="isDevMode" style="z-index: 99999">
      <a class="link" @click="openDevTools">Dev Tools</a>
    </div>
    <div class="top-nav-item" v-if="isDevMode">
      <a class="link" @click="navigateDesignSystem">Design System</a>
    </div>
    <div class="top-nav-item" :class="{ 'top-nav-item--active': studioModeEnabled }">
      <a
        @click="studioMode"
        class="link">
        <i class="icon-studio-mode-3" v-tooltip.right="studioModeTooltip" /><span>{{ $t('Studio Mode') }}</span>
      </a>
    </div>
    <div v-if="isUserLoggedIn" class="top-nav-item" :class="{ 'top-nav-item--active': facemasksActive, 'top-nav-item--error': facemasksExtensionError }">
      <a
        @click="openFacemaskSettingsWindow"
        class="link">
        <i class="icon-face-masks-3" v-tooltip.right="facemasksTooltip" /><span>{{ $t('Face Masks') }}</span>
      </a>
    </div>
    <div class="top-nav-item">
      <a
        @click="navigateHelp"
        class="link">
        <i class="icon-question" v-tooltip.right="helpTooltip"></i>
        <span>{{ $t('Help') }}</span>
      </a>
    </div>
    <div class="top-nav-item">
      <a
        @click="openSettingsWindow"
        class="link">
        <i class="icon-settings" v-tooltip.right="settingsTooltip"/><span>{{ $t('Settings') }}</span>
      </a>
    </div>
    <div class="top-nav-item" v-if="isUserLoggedIn" v-tooltip.right="logoutTooltip">
      <login/>
  </div>
  <div class="top-nav-item" v-else>
      <login/>
  </div>
 </div>
</div>
</template>

<script lang="ts" src="./TopNav.vue.ts"></script>

<style lang="less">
@import '../styles/index';

.top-nav-item {
  .margin-left(2);
  display: flex;
  align-items: center;

  i {
    .margin-right(@0);
  }

  span {
    .margin-left();
  }

  &.top-nav-item--active {
    > a {
      > i,
      > span {
        color: var(--teal);
      }
    }
  }

  &.top-nav-item--error {
    > a {
      > i,
      > span {
        color: @red;
      }
    }
  }
}
</style>

<style lang="less" scoped>
@import '../styles/index';
@import '../styles/badges';

.top-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  .padding-h-sides(2);
  position: relative;
  max-width: none;
  background-color: var(--background);
  border-bottom: 1px solid var(--border);
  flex: 0 0 48px;
  z-index: 1;

  // block the nav buttons while loading
  &.loading:after {
    content: '';
    .absolute(0, 0, 0, 0);
    background-color: black;
    opacity: 0;
  }

  .tab-button {
    i,
    .fa {
      .margin-right(0);
    }

    span {
      .margin-left();
    }
  }
}

.top-nav--compact {
  .tab-button__text {
    display: none;
  }
}

.top-nav-right {
  flex-grow: 1;
  display: flex;
  text-align: right;
  justify-content: flex-end;
  align-items: center;
}

.link {
  span {
    display: none;
  }
}

.theme-toggle {
  position: relative;
  display: flex;
  align-items: center;
}

.theme-toggle__bg {
  height: 14px;
  width: 30px;
  padding: 0 16px;
  background: var(--input-border);
  position: relative;
  border-radius: 10px;
}

.theme-toggle__icon {
  position: absolute;
  top: -2px;
  width: 19px;
  right: -2px;
}

.theme-toggle__icon.active {
  left: -2px;
  right: auto;
}
</style>
