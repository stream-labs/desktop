<template>
<div class="tabs__container">
  <div class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-button"
      :class="{ active: tab.value === value }"
      @click="showTab(tab.value)">
      {{ tab.name }}
    </button>
  </div>
  <div class="tab-content">
    <slot v-for="tab in tabs" :name="tab.value" v-if="tab.value === value"/>
  </div>
</div>
</template>

<script lang="ts" src="./Tabs.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.tabs__container {
  height: 100%;
}

.tabs {
  display: flex;
  background-color: @bg-primary;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  padding: 0 15px;
  height: 54px;
  border-bottom: 1px solid @border;
}

.tab-content {
  height: calc(~'100% - 54px');
  position: relative;
  overflow-y: auto;
}
</style>
