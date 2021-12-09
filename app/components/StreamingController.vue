<template>
  <div class="nav-container">
    <div class="nav-item elapsed-time">
      <time>{{ streamingElapsedTime }}</time>
    </div>
    <div class="nav-item">
      <button
        :disabled="locked"
        class="record-button"
        @click="toggleRecording"
        :class="{ active: streamingService.isRecording }"
        v-tooltip.left="recordTooltip"
      >
        <span>{{ $t('streaming.recording') }}</span>
      </button>
    </div>

    <div
      class="nav-item replay-button-group"
      :class="{ 'is-replay-start': !replayBufferOffline }"
      v-if="replayBufferEnabled"
    >
      <button
        class="button--replay-buffer button--replay-start"
        @click="toggleReplayBuffer"
        v-tooltip.left="startReplayBufferTooltip"
      >
        <i class="icon-replay-buffer-start" />
      </button>
      <button
        class="button--replay-buffer button--replay-stop"
        @click="toggleReplayBuffer"
        v-tooltip.left="stopReplayBufferTooltip"
      >
        <i class="icon-replay-buffer-stop" />
      </button>
      <button
        class="button--replay-buffer button--replay-save"
        @click="saveReplay"
        :disabled="replayBufferSaving || replayBufferStopping"
        v-tooltip.left="saveReplayTooltip"
      >
        <i class="icon-replay-buffer-save" />
      </button>
    </div>

    <div class="nav-item">
      <start-streaming-button :disabled="locked" />
    </div>
  </div>
</template>

<script lang="ts" src="./StreamingController.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.nav-container {
  display: flex;
  align-items: center;
}

.nav-item {
  margin-left: 20px;

  @media (max-width: 1200px) {
    font-size: 12px;
    margin-left: 12px;
  }
}

.error-wrapper {
  position: absolute;
  z-index: 2;
}

.platform-error {
  background: rgba(251, 72, 76, 0.28);
  padding: 4px;
  border-radius: 3px;

  i {
    margin-left: 4px;
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

.elapsed-time {
  white-space: nowrap;
}

.record-button {
  position: relative;
  width: 32px;
  height: 32px;
  background-color: @text-secondary;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  .transition;
  .bold;
  box-sizing: content-box;
  letter-spacing: 0.2px;

  span {
    font-size: 12px;
  }

  &:hover {
    background: @red;
    span {
      color: @white;
    }
  }

  &.active {
    opacity: 1;
    animation: pulse 2.5s infinite;
    border: 1px solid @red;
    background: @red;
    span {
      color: @white;
    }
    &:hover {
      opacity: 1;
      background: rgba(204, 0, 41, 0.3);
      border: 1px solid @red;
      span {
        color: @red;
      }
    }
  }
}

.replay-button-group {
  display: flex;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  .transition;

  &.is-replay-start {
    width: 64px;
  }
}

.button--replay-start {
  background-color: @text-secondary;
  position: absolute;
  top: 0;
  right: 0;

  .is-replay-start & {
    display: none;
  }

  i {
    color: @white;
    font-size: 16px;
  }

  &:hover {
    background: @text-tertiary;
  }
}

.button--replay-stop {
  background: rgba(204, 0, 41, 0.3);
  position: absolute;
  top: 0;
  right: 32px;

  i {
    font-size: 12px;
    color: @red;
  }

  &:hover {
    background: rgba(204, 0, 41, 0.2);
  }
}

.button--replay-save {
  display: none;
  background-color: @text-secondary;
  position: absolute;
  top: 0;
  right: 0;

  .is-replay-start & {
    display: flex;
  }

  i {
    font-size: 16px;
    color: @white;
  }

  &:hover {
    background: @text-tertiary;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(252, 62, 63, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(0, 0, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
}
</style>
