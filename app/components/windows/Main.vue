<template>
<div class="main" :class="{'night-theme': nightTheme, 'day-theme': !nightTheme}" id="mainWrapper" @drop="onDropHandler">
  <title-bar :title="title" />
  <div class="main-spacer"></div>
  <news-banner/>
  <div class="main-loading" :class="{ hidden: !showLoadingSpinner }">
    <custom-loader></custom-loader>
  </div>
  <div
    class="main-contents"
    :class="{
      'main-contents--right': isLoggedIn && leftDock && !isOnboarding && hasLiveDock,
      'main-contents--left': isLoggedIn && !leftDock && !isOnboarding && hasLiveDock }">
    <live-dock v-if="isLoggedIn && leftDock && !isOnboarding" :onLeft="true" />

    <div class="main-middle" :class="mainResponsiveClasses" ref="mainMiddle">
      <resize-observer @notify="handleResize"></resize-observer>

      <top-nav v-if="(page !== 'Onboarding')" :locked="applicationLoading"></top-nav>
      <apps-nav v-if="platformApps.length > 0 && (page !== 'Onboarding')"></apps-nav>

      <component
        class="main-page-container"
        v-if="!showLoadingSpinner"
        :is="page"
        :params="params"/>
      <studio-footer v-if="!applicationLoading && (page !== 'Onboarding')" />
    </div>

    <live-dock v-if="isLoggedIn && !leftDock && !isOnboarding" />
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
  z-index: 999999999;
  background-color: var(--background);
  transition: opacity 0.5s ease-out, top 0.5s step-start, z-index 0.5s step-start;

  // Loader component is a fixed element that obscures the top bar
  /deep/ .s-loader__bg {
    top: 34px;
  }
}

.main-loading.hidden {
  opacity: 0;
  top: 9999999px;
  z-index: -9999999;
  transition-timing-function: ease-out, step-end, step-end;
}
</style>
