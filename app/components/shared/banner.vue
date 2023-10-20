<template>
  <div class="banner">
    <div class="banner-close">
      <i class="icon-close icon-btn" @click="close"></i>
    </div>
    <div class="banner-header">{{ title }}</div>
    <div class="banner-body">{{ body }}</div>
    <div class="banner-anchor">
      <a @click.prevent="openInDefaultBrowser($event)" :href="anchorLink" class="link">
        {{ anchorLabel }}
      </a>
    </div>
  </div>
</template>

<script lang="ts" src="./banner.vue.ts"></script>

<style lang="less" scoped>
@import url('../../styles/index');

.banner {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px;
  background-color: var(--color-bg-quinary);
  border: 1px solid var(--color-border-light);
  .radius;
}

.banner-header {
  .bold;

  margin-bottom: 4px;
  font-size: @font-size3;
  color: var(--color-text-light);
}

.banner-body {
  font-size: @font-size2;
  color: var(--color-text);
}

.banner-anchor {
  margin-top: 4px;
  font-size: @font-size2;

  a {
    color: var(--color-text-active);
  }
}

.banner-close {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
</style>
