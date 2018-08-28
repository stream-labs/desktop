<template>
<div class="tabs__container" :class="[showContent ? '' : 'condensed']">
  <div class="tabs" :class="className">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-button"
      :class="{ active: tab.value === value }"
      @click="showTab(tab.value)">
      {{ tab.name }}
    </button>
  </div>
  <div class="tab-content" v-if="showContent">
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

.tabs__container.condensed {
  height: auto;
}

.tabs {
  display: flex;
  background-color: @day-primary;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  .padding-top(@0);
  .padding-bottom(@0);
  .padding-right(2);
  .padding-left(2);
  height: 54px;
  border-bottom: 1px solid @day-border;
}

.tab-content {
  height: calc(~'100% - 54px');
  position: relative;
  overflow-y: auto;
}

.night-theme {
  .tabs {
    background-color: @night-primary;
    border-color: @night-border;
  }
}
</style>
