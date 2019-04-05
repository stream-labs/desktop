<template>
<div class="top-nav">
  <div class="tabs">
    <div class="top-nav-item studio-button" :class="{ 'top-nav-item--active': studioModeEnabled }">
      <a
        @click="studioMode"
        class="link">
        <i class="icon-studio-mode" /><span>{{ $t('common.studioMode') }}</span>
      </a>
    </div>
    <div class="top-nav-item">
      <a
        @click="openSettingsWindow"
        class="link"
        data-test="OpenSettings">
        <i class="icon-settings" /><span>{{ $t('common.settings') }}</span>
      </a>
    </div>
    <div class="top-nav-item feedback-button">
      <a
        @click="openFeedback"
        class="link">
        <i class="icon-feedback" /><span>{{ $t('common.feedback') }}</span>
      </a>
    </div>
    <div class="top-nav-item help-button">
      <a
        @click="openHelp"
        class="link">
        <i class="icon-help" /><span>{{ $t('common.help') }}</span>
      </a>
    </div>
    <div class="top-nav-item information-button" v-if="isDevMode">
      <a
        @click="openInformations"
        class="link">
        <i class="icon-notification" :class="{'isUnseen': hasUnseenInformation}" />
        <span>{{ $t('informations.title') }}</span>
      </a>
    </div>
  </div>

  <div class="top-nav-profile">
    <div class="top-nav-item" v-if="isDevMode">
      <a
        @click="openDevTools"
        class="link">
        <i class="icon-dev" />
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
@import "../styles/_colors";

.top-nav {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  font-size: 14px;
  padding: 0 16px;
  position: relative;
  flex: 0 0 38px;
  min-width: 100%;
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

  .top-nav-item {
    display: flex;
    align-items: center;
    margin-right: 12px;

    &.top-nav-item--active {
      >a {
        >i, >span {
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
