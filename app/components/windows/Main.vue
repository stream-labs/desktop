<template>
<div class="main" :class="{'night-theme': nightTheme, 'day-theme': !nightTheme}" id="mainWrapper" @drop="onDropHandler">
  <title-bar :title="title" />
  <div class="main-spacer"></div>
  <news-banner/>
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
      <div v-if="applicationLoading" class="main-loading">
        <custom-loader></custom-loader>
      </div>

      <component
        class="main-page-container"
        v-if="!applicationLoading"
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
</style>
