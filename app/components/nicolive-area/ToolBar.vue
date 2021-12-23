<template>
  <div class="tool-bar">
    <span class="status-indicator" :class="{ 'is-live': programStatus === 'onAir' }">LIVE</span>
    <span class="program-time"
      ><time>{{ format(programCurrentTime) }}</time> /
      <time>{{ format(programTotalTime) }}</time></span
    >
    <button
      class="manual-extention"
      v-tooltip.bottom="manualExtentionTooltip"
      @click="extendProgram"
      :disabled="autoExtensionEnabled || isExtending || !isProgramExtendable"
    >
      <i class="icon-extention icon-btn icon-btn--lg"></i>
    </button>
    <div class="reservation-timer" v-if="programStatus === 'reserved'">
      番組開始まで {{ format(-programCurrentTime) }}
    </div>
    <div class="auto-extention" v-if="!compactMode">
      <div class="toggle-item">
        <span class="toggle-label">自動延長</span
        ><input
          type="checkbox"
          :checked="autoExtensionEnabled"
          @click="toggleAutoExtension"
          class="toggle-button"
        />
      </div>
    </div>
    <div class="top-nav-item" v-if="compactMode">
      <a @click="fetchProgram" :disabled="isFetching" class="link"><i class="icon-reload"></i></a>
    </div>
    <div class="program-button" v-if="compactMode">
      <button
        v-if="programStatus === 'onAir' || programStatus === 'reserved'"
        @click="endProgram"
        :disabled="isEnding || programStatus === 'reserved'"
        class="button button--end-program button--soft-warning"
      >
        番組終了
      </button>
      <button
        v-else
        @click="startProgram"
        :disabled="isStarting"
        class="button button--start-program"
      >
        番組開始
      </button>
    </div>
  </div>
</template>
<script lang="ts" src="./ToolBar.vue.ts"></script>
<style lang="less" scoped>
@import '../../styles/index';

.tool-bar {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  background-color: @bg-tertiary;
  position: relative;
}

.status-indicator {
  color: @white;
  font-size: 12px;
  font-weight: bold;
  padding: 0 4px;
  line-height: 20px;
  opacity: 0.2;

  &.is-live {
    background-color: @red;
    animation: live-indeicator-shadow 3s infinite;
    opacity: 1;
  }
}

@keyframes live-indeicator-shadow {
  0% {
    box-shadow: 0 0 10px @red;
  }
  50% {
    box-shadow: 0 0 0 @red;
  }
  100% {
    box-shadow: 0 0 10px @red;
  }
}

.program-time {
  color: @white;
  font-size: 12px;
  margin-left: 16px;
}

.manual-extention {
  margin-left: 16px;
  i {
    font-size: 14px;
    margin-left: 0;
  }

  &:disabled {
    i {
      opacity: 0.26;
      cursor: inherit;
    }
  }
}

.auto-extention {
  margin-left: auto;
  padding-left: 16px;
  z-index: 2;
}

.reservation-timer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: @white;
  font-size: 12px;
  width: 100%;
  height: 100%;
  padding: 0 16px;
  background-color: rgba(0, 0, 0, 0.8);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}
</style>