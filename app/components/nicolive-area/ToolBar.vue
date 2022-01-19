<template>
  <div class="tool-bar">

    <div class="reservation-timer" v-if="programStatus === 'reserved'">
      番組開始まで {{ format(-programCurrentTime) }}
    </div>
    <div class="elapsed-time" v-else>
      <i class="icon-live" :class="{ 'is-onAir': isOnAir }"></i>
      <div class="program-time">
        <time>{{ format(programCurrentTime) }}</time> / 
        <time>{{ format(programTotalTime) }}</time>
      </div>
    </div>

    <div class="side-bar">
      <popper 
        trigger="click"
        :options="{ placement: 'bottom-end' }"
        @show="showPopupMenu = true"
        @hide="showPopupMenu = false"
      >
        <div class="popper">
          <ul class="popup-menu-list">
            <li class="popup-menu-item">
              <div class="toggle-item">
                <span class="toggle-label">自動延長</span
                ><input
                  type="checkbox"
                  :checked="autoExtensionEnabled"
                  @click="toggleAutoExtension"
                  class="toggle-button"
                />
              </div>
            </li>
            <li class="popup-menu-item">
              <button
                class="manual-extention link"
                @click="extendProgram"
                :disabled="autoExtensionEnabled || isExtending || !isProgramExtendable || programStatus === 'reserved'"
              >30分延長</button>
            </li>
          </ul>
        </div>
        <button class="button--circle button--secondary button--extention" v-tooltip.bottom="extentionTooltip" :class="{ 'is-show': showPopupMenu, 'active': autoExtensionEnabled }" slot="reference">
          <i class="icon-extention"></i>
        </button>
      </popper>
    
      <button @click="fetchProgram" :disabled="isFetching" v-tooltip.bottom="fetchTooltip" class="button--circle button--secondary">
        <i class="icon-reload"></i>
      </button>

      <div class="program-button">
        <button
          v-if="programStatus === 'onAir' || programStatus === 'reserved'"
          @click="endProgram"
          :disabled="isEnding || programStatus === 'reserved'"
          class="button button--end-program button--live"
        >
          番組終了
        </button>
        <button
          v-else-if="programStatus === 'end'"
          @click="createProgram"
          :disabled="isCreating"
          class="button button--primary"
        >
          番組作成
        </button>
        <button
          v-else
          @click="startProgram"
          :disabled="isStarting"
          class="button button--action"
        >
          番組開始
        </button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" src="./ToolBar.vue.ts"></script>
<style lang="less" scoped>
@import '../../styles/index';

.tool-bar {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 16px;
  background-color: var(--color-bg-quinary);
  position: relative;
}

.elapsed-time {
  display: flex;
  align-items: center;
}

.icon-live {
  font-size: @font-size5;
  color: var(--color-icon-disabled);
  margin-right: 8px;

  &.is-onAir {
    color: var(--color-live);
  }
}

.program-time,
.reservation-timer {
  .time-styling;
}

.side-bar {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.popper {
  .popper-styling();
  width: 160px;
}

.toggle-button {
  margin-left: auto;
}

.auto-extention {
  margin-left: auto;
  padding-left: 16px;
  z-index: 2;
}

.button--circle {
  margin-left: 16px;
}

.button--extention {
  i {
    margin-left: 2px;
  }
}

.program-button {
  margin-left: 16px;
}

</style>