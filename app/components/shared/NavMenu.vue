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
  padding: 8px 0; 
  flex: 0 0 232px;
  display: flex;
  flex-direction: column;

  i {
    font-size: @font-size5;
  }
}
</style>
