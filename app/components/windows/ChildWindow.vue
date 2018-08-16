<template>
<div style="height: 100%" :class="{'night-theme': nightTheme, 'day-theme': !nightTheme}">
  <!--
      we use 2 components for situation when we need to open a new window and
      save the previous window-component state
  -->
  <div class="blank-slate">
    <div class="spinner-spacer" />
    <i class="fa fa-spinner fa-pulse" />
    <div class="spinner-spacer" />
  </div>
  <component v-if="components[0].name" v-show="components[0].isShown" :is="components[0].name"/>
  <component v-if="components[1].name" v-show="components[1].isShown" :is="components[1].name"/>
</div>
</template>

<script lang="ts" src="./ChildWindow.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.blank-slate {
  display: flex;
  flex-direction: column;

  position: absolute;
  height: 100%;
  width: 100%;
  z-index: -1;

  background-color: @day-primary;
  font-size: 24px;
  text-align: center;
}

.spinner-spacer {
  flex-grow: 1;
}

.night-theme {
  .blank-slate {
    background-color: @night-primary;
    color: @night-text;
  }
}
</style>
