<template>
  <div class="footer">
    <div class="flex flex--center flex--grow flex--justify-start footer--left">
      <div class="error-wrapper" v-if="loggedIn && !youtubeEnabled">
        <div class="platform-error">
          <i class="fa fa-exclamation-triangle" />
          <span>{{ $t('YouTube account not enabled for live streaming') }}</span>
          <button class="button alert-button" @click="openYoutubeEnable">{{ $t('Fix') }}</button>
          <button class="button alert-button" @click="confirmYoutubeEnabled">
            {{ $t("I'm set up") }}
          </button>
        </div>
      </div>
      <i
        v-bind:class="['icon-leaderboard-4', 'metrics-icon', performanceIconClassName]"
        @click="openMetricsWindow"
        v-tooltip.left="$t('Open Performance Window')"
      />
      <performance-metrics :componentProps="{ mode: 'limited' }" class="performance-metrics" />
      <notifications-area class="notifications-area flex--grow" />
    </div>

    <div class="nav-right">
      <div v-if="streamingService.isRecording" class="nav-item record-time">
        {{ recordingTime }}
      </div>
      <div class="nav-item">
        <button
          :disabled="locked"
          class="record-button"
          @click="toggleRecording"
          :class="{ active: streamingService.isRecording }"
        >
          <span>REC</span>
        </button>
      </div>
      <div class="nav-item" v-if="replayBufferEnabled && replayBufferOffline">
        <button
          class="circle-button"
          @click="toggleReplayBuffer"
          v-tooltip.left="$t('Start Replay Buffer')"
        >
          <i class="icon-replay-buffer" />
        </button>
      </div>
      <div class="nav-item replay-button-group" v-if="!replayBufferOffline">
        <button
          class="circle-button left-replay button--soft-warning"
          @click="toggleReplayBuffer"
          v-tooltip.left="$t('Stop')"
        >
          <i class="fa fa-stop" />
        </button>
        <button
          class="circle-button right-replay"
          @click="saveReplay"
          :disabled="replayBufferSaving || replayBufferStopping"
          v-tooltip.left="$t('Save Replay')"
        >
          <i class="icon-save" />
        </button>
      </div>
      <div class="nav-item" v-if="canSchedule">
        <button
          class="circle-button"
          @click="openScheduleStream"
          v-tooltip.left="$t('Schedule Stream')"
        >
          <i class="icon-date" />
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
@import '../styles/index';

.footer {
  .padding-h-sides(2);
  .padding-v-sides();

  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  position: relative;
  background-color: var(--section);
  max-width: none;
  flex: 0 0 auto;
  overflow-x: auto;
  overflow-y: hidden;

  .footer--left {
    overflow-x: auto;
  }
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-item {
  .margin-left(2);
}

.error-wrapper {
  background-color: var(--section);
  position: absolute;
  z-index: 2;
}

.platform-error {
  background: var(--warning-bg);
  padding: 5px;
  .radius();

  i {
    margin-left: 5px;
    color: var(--warning);
  }

  span {
    padding-left: 5px;
    margin-right: 10px;
    color: var(--warning);
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

.metrics-icon {
  padding-right: 12px;

  &:hover {
    cursor: pointer;
  }
}

.warning {
  color: var(--warning);
}

.info {
  color: var(--info);
}

.success {
  color: var(--teal);
}

.record-button {
  .weight(@bold);

  position: relative;
  width: 30px;
  height: 30px;
  background-color: var(--button);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  box-sizing: content-box;
  letter-spacing: 0.2px;

  span {
    font-size: 10px;
    color: var(--warning);
  }

  &:hover {
    background-color: var(--button-hover);
  }

  &.active {
    animation: pulse 2.5s linear infinite;
    background-color: var(--warning);

    span {
      color: var(--white);
    }
  }

  &:focus {
    outline: none;
  }
}

.record-time {
  color: var(--warning);
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

.replay-button-group {
  font-size: 0;
  white-space: nowrap;
  display: flex;

  > button {
    font-size: 12px;
  }

  > .left-replay {
    border-radius: 100% 0 0 100%;
  }

  > .right-replay {
    border-radius: 0 100% 100% 0;
  }
}

.performance-metrics {
  position: relative;
  display: inline-flex;
  background: var(--section) !important;
  overflow-x: auto;
}
</style>
