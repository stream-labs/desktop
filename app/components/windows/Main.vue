<template>
<div class="main" :class="{'night-theme': nightTheme, 'day-theme': !nightTheme}" id="mainWrapper" @drop="onDropHandler">
  <title-bar :title="title" />
  <div class="main-spacer"></div>
  <news-banner/>
  <div
    class="main-contents"
    :class="{
      'main-contents--right': renderDock && leftDock && hasLiveDock,
      'main-contents--left': renderDock && !leftDock && hasLiveDock }">
    <div class="live-dock-wrapper" v-if="renderDock && leftDock">
      <live-dock :onLeft="true" />
      <resize-bar
        v-if="!dockCollapsed"
        class="live-dock-resize-bar live-dock-resize-bar--left"
        position="right"
        @onresizestart="onResizeStartHandler"
        @onresizestop="onResizeStopHandler"
      />
    </div>

    <div class="main-middle" :class="mainResponsiveClasses" ref="mainMiddle">
      <resize-observer @notify="handleResize"></resize-observer>

      <top-nav v-if="(page !== 'Onboarding')" :locked="applicationLoading"></top-nav>
      <apps-nav v-if="platformApps.length > 0 && (page !== 'Onboarding')"></apps-nav>
      <div v-if="showLoadingSpinner" class="main-loading">
        <custom-loader></custom-loader>
      </div>

      <component
        class="main-page-container"
        v-if="!showLoadingSpinner"
        :is="page"
        :params="params"/>
      <studio-footer v-if="!applicationLoading && (page !== 'Onboarding')" />
    </div>

    <div class="live-dock-wrapper" v-if="renderDock && !leftDock">
      <resize-bar
        v-if="!dockCollapsed"
        class="live-dock-resize-bar"
        position="left"
        @onresizestart="onResizeStartHandler"
        @onresizestop="onResizeStopHandler"
      />
      <live-dock class="live-dock" />
    </div>
  </div>
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
}

.main-page-container {
  /* Page always takes up remaining space */
  flex-grow: 1;
  display: flex;
  position: relative;
}

.main-loading {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
