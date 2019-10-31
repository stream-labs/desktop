<template>
  <ul class="nav-menu" :class="{'nav-menu--child': isChild}">
    <slot></slot>
  </ul>
</template>

<script lang="ts" src="./NavMenu.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.nav-menu:not(.nav-menu--child) {
  margin: 0;
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  background-color: @bg-secondary;
}
</style>
