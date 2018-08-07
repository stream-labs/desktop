<template>
  <ul class="nav-menu">
    <slot></slot>
  </ul>
</template>

<script lang="ts" src="./NavMenu.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.nav-menu {
  margin: 0 0 -20px -20px;
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
  margin-top: -20px;
  padding-top: 20px;
}
</style>
