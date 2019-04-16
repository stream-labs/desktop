<template>
<div class="footer">
  <div class="flex flex--center flex--grow flex--justify-start">
    <performance-metrics />
  </div>

  <div class="nav-right">
    <div class="nav-item elapsed-time">
      <time>{{ streamingElapsedTime }}</time>
    </div>
    <div class="nav-item">
      <button
        :disabled="locked"
        class="record-button"
        @click="toggleRecording"
        :class="{ active: streamingService.isRecording }"
        v-tooltip.left="recordTooltip">
        <span>{{ $t('streaming.recording') }}</span>
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
@import "../styles/_colors";
@import "../styles/mixins";

.footer {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  position: relative;
  padding: 8px;
  max-width: none;
  flex: 0 0 auto;
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-item {
  margin-left: 20px;

  @media(max-width: 1200px) {
    font-size: 12px;
    margin-left: 12px;
  }
}

.error-wrapper {
  position: absolute;
  z-index: 2;

}

.platform-error {
  background: rgba(251,72,76,.28);
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
    background: rgba(251,72,76,.36);
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
  letter-spacing: .2px;

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
      background: rgba(204, 0, 41, .3);
       border: 1px solid @red;
      span {
        color: @red;
      }
    }
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
