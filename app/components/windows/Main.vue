<template>
<div class="main" :class="{'night-theme': nightTheme}">
  <title-bar :title="title" />
  <div class="main-spacer bgColor-teal"></div>
  <div class="main-contents">
    <live-dock v-if="isLoggedIn && leftDock && !isOnboarding" :onLeft="true" />
    <div class="main-middle">
      <div v-if="applicationLoading" class="main-loading">
        <i class="fa fa-spinner fa-pulse main-loading-spinner"/>
      </div>
      <top-nav v-if="(page !== 'Onboarding') && !applicationLoading"></top-nav>
      <component
        v-if="!applicationLoading"
        class="main-page-container"
        :is="page"/>
      <studio-footer v-if="(page !== 'Onboarding') && !applicationLoading"/>
    </div>
    <live-dock v-if="isLoggedIn && !leftDock && !isOnboarding" />
  </div>
</div>
</template>

<script lang="ts" src="./Main.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.main {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-contents {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
}

.main-middle {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.main-spacer {
  height: 4px;
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

.main-loading-spinner {
  font-size: 42px;
}
</style>
