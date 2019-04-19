<template>
  <div class="tool-bar">
    <span class="status-indicator" :class="{ 'is-live': programStatus === 'onAir' }">LIVE</span>
    <span class="program-time"><time>{{ format(programCurrentTime) }}</time> / <time>{{ format(programTotalTime) }}</time></span>
    <button class="manual-extention" @click="extendProgram" :disabled="autoExtensionEnabled || isExtending || !isProgramExtendable">
      <i class="icon-manual-extention icon-btn icon-btn--lg" v-tooltip.bottom="manualExtentionTooltip"></i>
    </button>
    <div class="reservation-timer" v-if="programStatus === 'reserved'">
      番組開始まで {{ format(-programCurrentTime) }}
    </div>
    <div class="auto-extention">
      <div class="toggle-item"><span class="toggle-label">自動延長</span><input type="checkbox" :checked="autoExtensionEnabled" @click="toggleAutoExtension" class="toggle-button"/></div>
    </div>
  </div>
</template>
<script lang="ts" src="./ToolBar.vue.ts"></script>
<style lang="less" scoped>
@import "../../styles/_colors";
@import "../../styles/mixins";

.tool-bar {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  background-color: @bg-secondary;
  position: relative;
}

.status-indicator {
  color: @white;
  font-size: 10px;
  font-weight: bold;
  padding: 0 4px;
  line-height: 18px;
  border-radius: 2px;
  opacity: .2;

  &.is-live {
    background-color: @red;
    animation: live-indeicator-shadow 3s infinite;
    opacity: 1;
  }
}

@keyframes live-indeicator-shadow {
  0% { box-shadow: 0 0 10px @red; }
  50% { box-shadow: 0 0 0 @red; }
  100% { box-shadow: 0 0 10px @red; }
}

.program-time {
  color: @white;
  font-size: 12px;
  margin-left: 12px;
}

.manual-extention {
  i {
    margin-left: 12px;
  }
}

.auto-extention {
  margin-left: auto;
  padding-left: 16px;
  border-left: 1px solid @bg-primary;
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
  background-color: rgba(0,0,0,.8);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}
</style>
