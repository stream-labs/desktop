<template>
<div class="main" :class="{'night-theme': nightTheme, 'day-theme': !nightTheme}" id="mainWrapper" @drop="onDropHandler">
  <title-bar :title="title" />
  <div class="main-spacer"></div>
  <news-banner/>
  <div class="main-contents" :class="{ 'main-contents--right': isLoggedIn && leftDock && !isOnboarding, 'main-contents--left': isLoggedIn && !leftDock && !isOnboarding }">
    <live-dock v-if="isLoggedIn && leftDock && !isOnboarding" :onLeft="true" />

    <div class="main-middle" :class="mainResponsiveClasses" ref="main_middle">
      <resize-observer @notify="handleResize"></resize-observer>

      <top-nav v-if="(page !== 'Onboarding')" :locked="applicationLoading"></top-nav>
      <apps-nav v-if="platformApps.length > 0 && (page !== 'Onboarding')"></apps-nav>
      <div v-if="shouldLockContent" class="main-loading">
        <custom-loader></custom-loader>
      </div>

      <!--
        The style tag on this element is a hack to prevent a visual glitch when switching back to editor.
        It shouldn't technically be necessary, but if it is removed, the editor component renders
        in first, followed by the persistent app webview being removed a split-second later.  This
        causes the display to be rendered small, and then snaps up to its full size, which is jarring.
      -->
      <PlatformAppWebview
        class="main-page-container"
        v-for="app in platformApps"
        :key="app.id"
        v-if="(page !== 'Onboarding') && (((page === 'PlatformAppContainer') && (params.appId === app.id)) || isAppPersistent(app.id))"
        :appId="app.id"
        :pageSlot="appPageSlot"
        :poppedOut="isAppPoppedOut(app.id)"
        :style="{ position: isAppVisible(app.id) ? 'inherit' : 'absolute' }"
        :visible="isAppVisible(app.id)" />
      <component
        class="main-page-container"
        v-if="page !== 'PlatformAppContainer' && !shouldLockContent"
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
  .performance-metric__label {
    display: none;
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
