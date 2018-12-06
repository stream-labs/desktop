<template>
<div class="apps-nav-wrapper">
  <div class="apps-nav">
    <resize-observer @notify="handleResize"></resize-observer>
    <div
      v-if="hasPrev"
      @click="scrollLeft"
      class="apps-nav-control flex has-prev">
      <i class="icon-down icon-left"></i>
      <span>...</span>
    </div>
    <div
      ref="app_tabs"
      class="apps-tab__container"
      :class="{
        'has-next': hasNext,
        'has-prev': hasPrev
      }"
    >
    <resize-observer @notify="handleResize"></resize-observer>
      <span
        v-for="(app, index) in topNavApps"
        :key="index"
        @click="navigateApp(app.id)"
        class="app-tab"
        :class="{ 'is-active': isSelectedApp(app.id) }">
        <span> {{ app.manifest.name }} </span>
        <span v-if="isSelectedApp(app.id)">
          <i
            v-if="app.unpacked"
            @click="refreshApp(app.id)"
            class="app-tab-icon icon-repeat"></i>
          <i
            v-if="isPopOutAllowed(app)"
            @click="popOut(app.id)"
            class="app-tab-icon icon-pop-out-1"></i>
        </span>
      </span>
    </div>
    <div
      v-if="hasNext"
      @click="scrollRight"
      class="apps-nav-control flex has-next">
      <span>...</span>
      <i class="icon-down icon-right"></i>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./AppsNav.vue.ts"></script>

<style lang="less" scoped>
@import '../styles/index';

.apps-nav-wrapper {
  position: relative;
  height: 35px;
}

.apps-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  .padding-h-sides();
  position: relative;
  max-width: none;
  background-color: @day-secondary;
  border-bottom: 1px solid @day-border;
  flex: 0 0 35px;
  height: 35px;
  z-index: 1;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
}

.apps-tab__container {
  display: inline-block;
  overflow-x: auto;
  white-space: nowrap;
  overflow-y: hidden;

  &.has-prev {
    .margin-left();
  }

  &.has-next {
    .margin-right();
  }
}

.apps-nav-control {
  cursor: pointer;
  position: relative;

  &.has-prev {
    .margin-left();

    i {
      .margin-right();
    }
  }
  &.has-next {
    .margin-right();

    i {
      .margin-left();
    }
  }
}

.apps-tab__container::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.app-tab {
  .padding();
  color: @day-paragraph;
  .weight(@medium);
  cursor: pointer;

  &.is-active {
    color: @day-title;
  }
}

.app-tab-icon {
  margin-left: 4px;
}

.night-theme {
  .apps-nav {
    background-color: @night-primary;
    border-color: @night-border;
  }
  .app-tab {
    color: @night-paragraph;

    &.is-active {
      color: @night-title;
    }
  }
}
</style>
