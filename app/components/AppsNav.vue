<template>
<div class="apps-nav-wrapper">

  <div class="apps-nav">

    <h-scroll
      @change="(model) => scrollModel = model"
      ref="scroll"
      class="apps-tab__container"
    >
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
    </h-scroll>


    <div class="left" v-if="scrollModel.canScrollLeft" @click="scrollLeft" >
      <i class="icon-down icon-left"></i>
    </div>

    <div class="right" v-if="scrollModel.canScrollRight" @click="scrollRight">
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
  .padding-h-sides();

  display: flex;
  flex-direction: row;
  align-items: center;
  max-width: none;
  background-color: var(--background);
  border-bottom: 1px solid var(--border);
  flex: 0 0 35px;
  height: 35px;
  z-index: 1;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;

  &:hover {
    // show arrows
    .left,
    .right { opacity: 1; }
  }
}

.apps-tab__container {
  display: inline-block;
  overflow-x: auto;
  white-space: nowrap;
  overflow-y: hidden;
}

.apps-nav-control {
  cursor: pointer;
  position: relative;
}

.apps-tab__container::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.app-tab {
  .padding();
  .weight(@medium);

  color: var(--paragraph);
  cursor: pointer;

  &.is-active {
    color: var(--title);
  }
}

.app-tab-icon {
  margin-left: 4px;
}

.left {
  .absolute(0, auto, 0, 0);

  transition: opacity @transition-time;
  padding-top: 8px;
  width: 20px;
  background-image: linear-gradient(to right, var(--background) 80%, transparent);
  z-index: 1;
  opacity: 0;
}

.right {
  .absolute(0, 0, 0, auto);

  transition: opacity @transition-time;
  padding-top: 8px;
  width: 20px;
  background-image: linear-gradient(to left, var(--background) 80%, transparent);
  z-index: 1;
  text-align: right;
  opacity: 0;
}
</style>
