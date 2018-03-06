<template>
<div
  class="live-dock"
  :class="{ collapsed, 'live-dock--left': onLeft }"
  :style="{ width: (liveDockSize * 100) + '%' }">
  <div
    class="live-dock-chevron icon-btn"
    v-if="collapsed"
    @click="expand">
    <i class="fa" :class="{
      'fa-chevron-left': !onLeft,
      'fa-chevron-right': onLeft
    }" />
  </div>

  <transition name="slide-fade">
    <div
      v-show="!collapsed"
      class="live-dock-expanded-contents">
      <i
        class="fa live-dock-chevron icon-btn"
        :class="{
          'fa-chevron-left': onLeft,
          'fa-chevron-right': !onLeft
        }"
        @click="collapse" />
      <div class="live-dock-header">
        <div class="flex flex--center">
          <div :class="{ 'live-dock-pulse': true, 'live-dock-offline': !isLive  }" />
          <span class="live-dock-text">
            {{ liveText }}
          </span>
          <span class="live-dock-timer">
            {{ elapsedStreamTime }}
          </span>
        </div>
        <div class="live-dock-viewer-count">
          <i
            class="fa fa-eye live-dock-viewer-count-toggle label--icon"
            :class="{
              'fa-eye': !hideViewerCount,
              'fa-eye-slash': hideViewerCount
            }"
            @click="toggleViewerCount"/>
          <i class="fa fa-user label--icon" />
          <span class="semibold">{{ viewerCount }}</span> viewers
        </div>
      </div>

      <div class="live-dock-info">
        <div class="live-dock-platform-tools">
          <a title="Edit Stream Info" @click="showEditStreamInfo" v-if="isTwitch || isMixer || (isYoutube && isStreaming)"><i class="fa fa-pencil" /></a>
          <a title="View Stream" @click="openYoutubeStreamUrl" v-if="isYoutube && isStreaming"><i class="fa fa-video-camera" /></a>
          <a title="Live Dashboard" @click="openYoutubeControlRoom" v-if="isYoutube && isStreaming"><i class="fa fa-cogs" /></a>
        </div>
        <a @click="refreshChat" v-if="isTwitch || isMixer || (isYoutube && isStreaming)">Refresh Chat</a>
      </div>

      <div class="live-dock-chat" v-if="isTwitch || isMixer || (isYoutube && isStreaming)">
        <chat ref="chat" />
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
  width: 28%;
  border-left: 1px solid @day-border;
  padding: 16px 20px 10px;
  transition: all 275ms;

  &.live-dock--left {
    border-right: 1px solid @day-border;

    .live-dock-chevron {
      right: 5px;
      left: inherit;
    }
  }

  &.collapsed {
    width: 20px!important;
    padding: 0;
  }

  @media (max-width: 1100px) {
    display: none;
  }
}

.live-dock-chevron {
  cursor: pointer;
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  height: 100%;
  left: 0px;
  padding-left: 5px;

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

  .live-dock-platform-tools {
    a {
      padding: 0 10px;
    }
  }

  @media (max-width: 1200px) {
    font-size: 12px;
  }
}

.live-dock-viewer-count {
  .live-dock-viewer-count-toggle {
    opacity: 0;
    cursor: pointer;
  }

  &:hover {
    .live-dock-viewer-count-toggle {
      opacity: 1;
    }
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

  &.live-dock-offline {
    background: @grey;
    animation: none;
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
