<template>
<div>
  <div>
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
  </div>
  <div class="tab-content">
    <slot v-for="tab in tabs" :name="tab.value" v-if="tab.value === value"/>
  </div>
</div>
</template>

<script lang="ts" src="./Tabs.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.tabs {
  display: flex;
  background-color: @day-primary;
  box-sizing: border-box;
  position: absolute;
  width: 100%;
  padding: 0 15px;
  height: 54px;
  z-index: 10;
  border-bottom: 1px solid @day-border;
}

.tab-content {
  padding-top: 54px;
}

.night-theme {
  .tabs {
    background-color: @night-primary;
    border-color: @night-border;
  }
}
</style>
