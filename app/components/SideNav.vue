<template>
  <div class="top-nav">
    <div class="tabs">
      <div class="top-nav-item" :class="{ 'top-nav-item--active': studioModeEnabled }">
        <a @click="studioMode" class="link">
          <i class="icon-studio-mode" :title="$t('common.studioMode')" />
        </a>
      </div>
      <div class="top-nav-item">
        <a @click="openSettingsWindow" class="link" data-test="OpenSettings">
          <i class="icon-settings" :title="$t('common.settings')" />
        </a>
      </div>
      <div class="top-nav-item feedback-button">
        <a @click="openFeedback" class="link">
          <i class="icon-feedback" :title="$t('common.feedback')" />
        </a>
      </div>
      <div class="top-nav-item help-button">
        <a @click="openHelp" class="link">
          <i class="icon-help" :title="$t('common.help')" />
        </a>
      </div>
      <div class="top-nav-item information-button">
        <a @click="openInformations" class="link">
          <i
            class="icon-notification"
            :class="{ isUnseen: hasUnseenInformation }"
            :title="$t('informations.title')"
          />
        </a>
      </div>
    </div>

    <div class="top-nav-profile">
      <div class="top-nav-item" v-if="isDevMode">
        <a @click="openDevTools" class="link">
          <i class="icon-dev" title="開発者ツール" />
        </a>
      </div>
      <div class="top-nav-item" title="ログイン">
        <login />
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./SideNav.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';
.top-nav {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
  font-size: 14px;
  padding: 0 16px;
  position: relative;
  flex: 0 0 38px;
  // min-width: 100%;
  background-color: @bg-tertiary;
  i {
    font-size: 14px;
    margin-right: 4px;
    &.icon-dev {
      font-size: 16px;
    }
  }
}
.tabs {
  flex-grow: 1;
  display: flex;
  text-align: left;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;

  .top-nav-item {
    display: flex;
    align-items: center;
    margin-right: 12px;
    margin-top: 12px;
    margin-bottom: 12px;

    &.top-nav-item--active {
      > a {
        > i,
        > span {
          color: @text-primary;
        }
      }
    }
  }
}

.top-nav-profile {
  flex-grow: 1;
  display: flex;
  text-align: right;
  justify-content: flex-end;
  align-items: center;
  flex-direction: column;
  .top-nav-item {
    margin-left: 8px;
    display: flex;
    align-items: center;
  }
}

.user__name {
  &:hover {
    color: @white;
  }
}

.icon-notification {
  position: relative;

  &.isUnseen {
    &:after {
      content: '';
      display: block;
      position: absolute;
      right: -2px;
      bottom: -1px;
      width: 9px;
      height: 9px;
      background-color: @accent-hover;
      border-radius: 100%;
      border: 1px solid @bg-tertiary;
    }
  }
}
</style>
