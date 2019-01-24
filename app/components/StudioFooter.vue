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
    <div class="nav-item" v-if="replayBufferEnabled && replayBufferOffline">
      <button class="button button--default replay-button" @click="toggleReplayBuffer">{{ $t('Start Replay Buffer') }}</button>
    </div>
    <div class="nav-item replay-button-group" v-if="!replayBufferOffline">
      <button class="button button--soft-warning" @click="toggleReplayBuffer">{{ $t('Stop') }}</button>
      <button class="button button--default" @click="saveReplay" :disabled="replayBufferSaving || replayBufferStopping">
        {{ $t('Save Replay') }}
      </button>
    </div>
    <div class="nav-item" v-if="canSchedule">
      <button class="button button--default" @click="openScheduleStream" >{{ $t('Schedule Stream')}}</button>
    </div>
    <div class="nav-item">
      <start-streaming-button :disabled="locked" />
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./StudioFooter.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

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
}

.error-wrapper {
  background-color: @day-secondary;
  position: absolute;
  z-index: 2;
}

.platform-error {
  background: rgba(251, 72, 76, 0.28);
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
    background: rgba(251, 72, 76, 0.36);
    margin: 0 5px;
    padding: 0 8px;
    font-size: 10px;
  }
}

.record-button {
  position: relative;
  width: 30px;
  height: 30px;
  background-color: @day-button;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  .transition();
  .weight(@bold);
  box-sizing: content-box;
  letter-spacing: 0.2px;

  span {
    font-size: 10px;
    color: @red;
  }

  &:hover {
    background-color: darken(@day-button, 8%);
  }

  &.active {
    animation: pulse 2.5s linear infinite;
    background-color: @red;

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
    box-shadow: 0 0 2px 0 rgba(252, 62, 63, 0.6);
  }
  70% {
    box-shadow: 0 0 2px 4px rgba(252, 62, 63, 0.6);
  }
  100% {
    box-shadow: 0 0 2px 4px rgba(252, 62, 63, 0);
  }
}

.replay-button {
  font-size: 12px;
}

.replay-button-group {
  font-size: 0;
  white-space: nowrap;

  >button {
    font-size: 12px;
  }

  >button:nth-child(1) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  >button:nth-child(2) {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
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
    border-color: @night-border;

    &:hover {
      background-color: lighten(@night-button, 8%);
    }

    &.active {
      background-color: @red;
    }

    &:focus {
      outline: none;
    }
  }
}
</style>
