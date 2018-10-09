<template>
<div class="footer">
  <div class="flex flex--center flex--grow flex--justify-start">
    <div class="error-wrapper" v-if="loggedIn && !youtubeEnabled">
      <div class="platform-error">
        <i class="fa fa-exclamation-triangle" />
        <span>{{ $t('YouTube account not enabled for live streaming') }}</span>
        <button class="button alert-button" @click="openYoutubeEnable">{{ $t('Fix') }}</button>
        <button class="button alert-button" @click="confirmYoutubeEnabled">{{ $t('I\'m set up') }}</button>
      </div>
    </div>
    <performance-metrics />
    <global-sync-status v-if="loggedIn && !mediaBackupOptOut" />
    <notifications-area class="notifications-area flex--grow"/>
  </div>

  <div class="nav-right">
    <div class="nav-item">
      <test-widgets v-if="loggedIn" />
    </div>
    <div class="nav-item">
      <button
        :disabled="locked"
        class="record-button"
        @click="toggleRecording"
        :class="{ active: streamingService.isRecording }">
        <span>REC</span>
      </button>
    </div>
    <div class="nav-item">
      <start-streaming-button :disabled="locked" />
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./StudioFooter.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.footer {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  position: relative;
  .padding-h-sides(2);
  .padding-v-sides();
  background-color: @day-section;
  max-width: none;
  flex: 0 0 auto;
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-item {
  .margin-left(2);

  @media(max-width: 1200px) {
    font-size: 12px;
    margin-left: 12px;
  }
}

.error-wrapper {
  background-color: @day-secondary;
  position: absolute;
  z-index: 2;
}

.platform-error {
  background: rgba(251,72,76,.28);
  padding: 5px;
  .radius();

  i {
    margin-left: 5px;
    color: @red;
  }

  span {
    padding-left: 5px;
    margin-right: 10px;
    color: @red;
  }

  .alert-button {
    height: 18px;
    line-height: 12px;
    background: rgba(251,72,76,.36);
    margin: 0 5px;
    padding: 0 8px;
    font-size: 10px;
  }
}

.record-button {
  position: relative;
  width: 32px;
  height: 32px;
  background-color: @day-button;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  .transition();
  .weight(@bold);
  border: 1px solid @day-button;
  box-sizing: content-box;

  span {
    font-size: 10px;
    color: @day-title;
    .weight(@medium);
  }

  &.active {
    animation: pulse 2s ease-in-out infinite;
    border-color: @red;
    background-color: @red;
    color: @white;

    span {
      color: @white;
    }
  }

  &:focus {
    outline: none;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(252, 62, 63, 0.4);
  }
  70% {
    box-shadow: 0 0 1px 4px rgba(252, 62, 63, 0.4);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(252, 62, 63, 0.4);
  }
}

.night-theme {
  .footer {
    background-color: @night-section;
  }

  .error-wrapper {
    background-color: @night-primary;
  }

  .record-button {
    background-color: @night-button;
    border-color: @night-button;

    &.active {
      border-color: @red;
      background-color: @red;
    }

    span {
      color: @white;
    }
  }
}
</style>
