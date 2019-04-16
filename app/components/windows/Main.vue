<template>
<div class="main" :class="theme" id="mainWrapper" @drop="onDropHandler">
  <title-bar :title="title" />
  <div class="main-spacer" :class="{ 'main-spacer--error': errorAlert }"></div>
  <news-banner/>
  <div
    class="main-contents"
    :class="{
      'main-contents--right': renderDock && leftDock && hasLiveDock,
      'main-contents--left': renderDock && !leftDock && hasLiveDock }">
    <div class="live-dock-wrapper" v-if="renderDock && leftDock">
      <live-dock :onLeft="true" />
      <resize-bar
        v-if="!isDockCollapsed"
        class="live-dock-resize-bar live-dock-resize-bar--left"
        position="right"
        @onresizestart="onResizeStartHandler"
        @onresizestop="onResizeStopHandler"
      />
    </div>

    <div class="main-middle" :class="mainResponsiveClasses" v-if="!showLoadingSpinner" ref="mainMiddle">
      <resize-observer @notify="handleResize"></resize-observer>

      <top-nav v-if="(page !== 'Onboarding')" :locked="applicationLoading"></top-nav>
      <apps-nav v-if="platformApps.length > 0 && (page !== 'Onboarding')"></apps-nav>

      <component
        class="main-page-container"
        :is="page"
        :params="params"/>
      <studio-footer v-if="!applicationLoading && (page !== 'Onboarding')" />
    </div>

    <div class="live-dock-wrapper" v-if="renderDock && !leftDock">
      <resize-bar
        v-if="!isDockCollapsed"
        class="live-dock-resize-bar"
        position="left"
        @onresizestart="onResizeStartHandler"
        @onresizestop="onResizeStopHandler"
      />
      <live-dock class="live-dock" />
    </div>
  </div>
  <transition name="loader">
    <div class="main-loading" v-if="showLoadingSpinner"><custom-loader></custom-loader></div>
  </transition>
</div>
</template>

<script lang="ts" src="./Main.vue.ts"></script>

<style lang="less">
.main-middle--compact {
  .performance-metric-icon {
    height: 12px;
  }

  .performance-metric {
    font-size: 12px;
  }
}
</style>

<style lang="less" scoped>
@import '../../styles/index';

.main {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
}

.main-contents {
  display: grid;
  grid-template-columns: 1fr;
  height: 100%;
}

.main-contents--right {
  grid-template-columns: auto 1fr;
}

.main-contents--left {
  grid-template-columns: 1fr auto;
}

.main-middle {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.main-spacer {
  height: 4px;
  flex: 0 0 4px;
  .bg--teal();

  &.main-spacer--error {
    background-color: @red;
  }
}

.main-page-container {
  /* Page always takes up remaining space */
  flex-grow: 1;
  display: flex;
  position: relative;
}

.main-loading {
  position: absolute;
  top: 34px;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999999;
  background-color: var(--background);

  // Loader component is a fixed element that obscures the top bar
  /deep/ .s-loader__bg {
    top: 34px;
  }
}

.loader-enter-active,
.loader-leave-active {
  transition: opacity 0.5s ease-out;
}

.loader-enter,
.loader-leave-to {
  opacity: 0;
}

.live-dock {
  height: 100%;
}

.live-dock-wrapper {
  position: relative;
}

.live-dock-resize-bar {
  position: absolute;
  height: 100%;
}

.live-dock-resize-bar--left {
  top: 0;
  right: 0;
}
</style>
