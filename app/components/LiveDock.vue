<template>
<div class="live-dock" :class="{ collapsed }">
  <div
    class="live-dock-chevron icon-btn"
    v-if="collapsed"
    @click="expand">
    <i class="fa fa-chevron-left" />
  </div>

  <transition name="slide-fade">
    <div
      v-show="!collapsed"
      class="live-dock-expanded-contents">
      <i class="fa fa-chevron-right live-dock-chevron icon-btn" @click="collapse" />
      <div class="live-dock-header">
        <div class="flex flex--center">
          <div :class="{ 'live-dock-pulse': true, 'live-dock-offline': !isStreaming  }" />
          <span class="live-dock-text">
            {{ liveText }}
          </span>
          <span class="live-dock-timer">
            {{ elapsedStreamTime }}
          </span>
        </div>
        <div class="live-dock-viewer-count">
          <i class="fa fa-user label--icon" />
          <span class="semibold">{{ viewerCount }}</span> viewers
        </div>
      </div>

      <div class="live-dock-info">
        <a @click="showEditStreamInfo" v-if="isTwitch">Edit Stream Info</a>
        <PerformanceMetricsStream />
      </div>

      <div class="live-dock-chat">
        <chat/>
      </div>
    </div>
  </transition>
</div>
</template>

<script lang="ts" src="./LiveDock.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.live-dock {
  position: relative;
  z-index: 1000;
  width: 30%;
  border-left: 1px solid @day-border;
  padding: 16px 20px 10px;
  transition: all 275ms;

  &.collapsed {
    width: 20px;
    padding: 0;
  }

  @media (max-width: 1100px) {
    display: none;
  }
}

.live-dock-chevron {
  cursor: pointer;
  position: absolute;
  top: 50%;
  left: 5px;

  &:hover {
    opacity: 1;
  }
}

.live-dock-end-stream {
  margin-left: 10px;
}

.live-dock-header {
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 1200px) {
    font-size: 12px;
  }
}

.live-dock-text {
  margin: 0 2px 0 4px;
  .semibold;
}

.live-dock-expanded-contents {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.live-dock-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;

  @media (max-width: 1200px) {
    font-size: 12px;
  }
}

.live-dock-chat {
  flex-grow: 1;
  position: relative;
}

.live-dock-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: @red;
  margin: 0 6px;
  box-shadow: 0 0 0 rgba(252, 62, 63, 0.4);
  animation: livepulse 2s infinite;

  &.live-dock-offline {
    background: @grey;
    animation: none;
  }
}

@keyframes livepulse {
  0% {
    box-shadow: 0 0 0 0 rgba(252, 62, 63, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
}

.night-theme {
  .live-dock {
    border-color: @night-border;
  }

  .live-dock-text,
  .live-dock-timer,
  .live-dock-viewer-count {
    color: @white;
  }
}
</style>
