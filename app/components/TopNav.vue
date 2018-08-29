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
      :disabled="!isUserLoggedIn || locked">
      <i class="icon-dashboard"/> <span>{{ $t('Dashboard') }}</span>
    </button>
    <!-- <button
      @click="navigateChatBot"
      class="tab-button"
      v-if="enabledFeature(availableFeatures.chatbot)"
      :class="{ active: page === 'Chatbot'}"
      :disabled="!isUserLoggedIn || locked">
      <i class="icon-chatbot"/> <span>{{ $t('Chatbot') }}</span>
    </button> -->
    <button
      @click="navigateOverlays"
      class="tab-button"
      :class="{ 'is-active': page === 'BrowseOverlays' }"
      :disabled="!isUserLoggedIn || locked">
      <i class="icon-themes"/> <span>{{ $t('Themes') }}</span>
    </button>
    <button
      @click="navigateStudio"
      class="tab-button"
      :class="{ 'is-active': page === 'Studio' }"
      :disabled="locked">
      <i class="icon-studio"/> <span>{{ $t('Editor') }}</span>
    </button>
    <button
      @click="navigateLive"
      class="tab-button"
      :class="{ 'is-active': page === 'Live' }"
      :disabled="!isUserLoggedIn || locked">
      <i class="icon-live-dashboard"/> <span>{{ $t('Live') }}</span>
    </button>
  </div>

  <div class="top-nav-right">

    <div class="top-nav-item">
      <button @click="toggleNightTheme" class="theme-toggle">
        <div class="theme-toggle__bg"></div>
        <img class="theme-toggle__icon theme-toggle__icon--moon" src="../../media/images/moon.png"/>
        <img class="theme-toggle__icon theme-toggle__icon--sun" src="../../media/images/sun.png"/>
      </button>
    </div>
    <div class="top-nav-item" v-if="isDevMode">
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
    <div class="top-nav-item">
      <a
        @click="openDiscord"
        class="link">
        <i class="icon-discord"></i><span>Discord</span>
      </a>
    </div>
    <div class="top-nav-item">
      <a
        @click="openSettingsWindow"
        class="link">
        <i class="icon-settings"/><span>{{ $t('Settings') }}</span>
      </a>
    </div>
    <div class="top-nav-item">
      <login/>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./TopNav.vue.ts"></script>

<style lang="less">
@import "../styles/index";

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
    >a {
      >i,
      >span {
        color: @teal;
      }
    }
  }
}
</style>

<style lang="less" scoped>
@import "../styles/index";
.top-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  .padding-h-sides(2);
  position: relative;
  max-width:  none;
  background-color: @day-secondary;
  border-bottom: 1px solid @day-border;
  flex: 0 0 48px;
  z-index: 1;
}

.top-nav-right {
  flex-grow: 1;
  display: flex;
  text-align: right;
  justify-content: flex-end;
  align-items: center;
}

.link {
  @media(max-width: 1500px) {
    span {
      display: none;
    }
  }
}

.theme-toggle {
  position: relative;
  display: flex;
  align-items: center;

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

.theme-toggle__bg {
  height: 14px;
  width: 30px;
  padding: 0px 16px;
  background: #e3e8eb;
  position: relative;
  border-radius: 10px;
}

.theme-toggle__icon {
  position: absolute;
  top: -2px;
}

.theme-toggle__icon--sun {
  width: 19px;
  right: -2px;
}

.theme-toggle__icon--moon {
  width: 18px;
  display: none;
  left: -2px;
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

  .theme-toggle__bg {
    background-color: rgba(255, 255, 255, .2);
  }

  .theme-toggle__icon--moon {
    display: block;
  }

  .theme-toggle__icon--sun {
    display: none;
  }
}
</style>
