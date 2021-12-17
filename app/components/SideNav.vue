<template>
  <div class="side-nav">
    <div class="primary-tab">
      <div class="side-nav-item">
        <a @click="toggleCompactMode" class="link">
          <i v-if="compactMode" class="icon-full-mode" :title="$t('common.fullMode')" />
          <i v-if="!compactMode" class="icon-compact-mode" :title="$t('common.compactMode')" />
        </a>
      </div>
      <template v-if="compactMode && isUserLoggedIn">
        <div class="secondary-tab">
          <div class="side-nav-item">
            <a
              @click="compactModeTab = 'niconico'"
              class="link"
              :class="{ active: compactModeTab === 'niconico' }"
              data-test="compact-tab-niconico"
            >
              <i :class="{ 'icon-niconico': true }" :title="$t('common.compactModeTab.niconico')" />
            </a>
          </div>
          <div class="side-nav-item">
            <a
              @click="compactModeTab = 'studio'"
              class="link"
              :class="{ active: compactModeTab === 'studio' }"
              data-test="compact-tab-studio"
            >
              <i :class="{ 'icon-video': true }" :title="$t('common.compactModeTab.studio')" />
            </a>
          </div>
        </div>
      </template>
      <div class="side-nav-item" v-if="isDevMode">
        <a @click="openDevTools" class="link">
          <i class="icon-dev" title="開発者ツール" />
        </a>
      </div>
    </div>

    <div class="filler"></div>

    <template v-if="!compactMode">
      <div class="bottom-tools">
        <div class="side-nav-item">
          <a
            @click="studioMode"
            class="link"
            :class="{ active: studioModeEnabled }"
            :title="$t('common.studioMode')"
          >
            <i class="icon-studio-mode" />
          </a>
        </div>
        <div class="side-nav-item feedback-button">
          <a @click="openFeedback" class="link" :title="$t('common.feedback')">
            <i class="icon-feedback" />
          </a>
        </div>
        <div class="side-nav-item help-button">
          <a @click="openHelp" class="link" :title="$t('common.help')">
            <i class="icon-help" />
          </a>
        </div>
        <div class="side-nav-item information-button">
          <a @click="openInformations" class="link" :title="$t('informations.title')">
            <i class="icon-notification" :class="{ isUnseen: hasUnseenInformation }" />
          </a>
        </div>
        <div class="side-nav-item">
          <a
            @click="openSettingsWindow"
            class="link"
            data-test="OpenSettings"
            :title="$t('common.settings')"
          >
            <i class="icon-settings" />
          </a>
        </div>
      </div>
    </template>
    <div class="side-nav-profile">
      <login />
    </div>
  </div>
</template>

<script lang="ts" src="./SideNav.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.side-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  background-color: var(--color-primary-light);
}

.link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 36px;

  &.active {
    color: var(--color-secondary);
  }
}

.primary-tab {
  display: flex;
  align-items: center;
  flex-direction: column;

  .link {
    height: 48px;

    i {
      font-size: @font-size6;
    }
  }
}

.secondary-tab {
  display: flex;
  align-items: center;
  flex-direction: column;

  &:before {
    content: '';
    width: 18px;
    height: 1px;
    background-color: var(--color-border-light);
    margin: 8px 0;
  }

  .link {
    height: 48px;

    i {
      font-size: @font-size5;
    }
  }
}

.bottom-tools {
  display: flex;
  flex-direction: column;
  align-items: center;

  .link {
    height: 36px;
  }

  &:after {
    content: '';
    width: 18px;
    height: 1px;
    background-color: var(--color-border-light);
    margin: 8px 0;
  }
}

.filler {
  flex: 2;
}

.side-nav-profile {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 48px;
  margin-bottom: 8px;
}

.icon-notification {
  position: relative;

  // お知らせ通知
  &.isUnseen {
    &:after {
      content: '';
      display: block;
      position: absolute;
      right: -6px;
      top: -6px;
      width: 12px;
      height: 12px;
      background-color: var(--color-accent-variant);
      border-radius: 50%;
      border: 2px solid var(--color-primary-light);
    }
  }
}
</style>
