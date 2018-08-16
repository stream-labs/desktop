<template>
  <ul class="nav-menu">
    <slot></slot>
  </ul>
</template>

<script lang="ts" src="./NavMenu.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.nav-menu {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
  padding-top: 16px;
}
</style>
