<template>
  <div class="tabs__container">
    <div class="tabs" :class="className">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-button"
        :class="{ active: tab.value === value }"
        @click="showTab(tab.value)"
      >
        {{ tab.name }}
      </button>
    </div>
    <scrollable className="tab-content" v-if="!hideContent" :autoSizeCapable="true">
      <slot v-for="tab in tabs.filter(t => t.value === value)" :name="tab.value" />
    </scrollable>
  </div>
</template>

<script lang="ts" src="./Tabs.vue.ts"></script>

<style lang="less">
@import '../styles/index';

.tabs__container {
  width: 100%;
}

.tabs {
  display: flex;
  background: transparent;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 48px;
  border: 0;
  border-bottom: 1px solid var(--border);
  padding: 0;
}

.tab-content {
  height: calc(~'100% - 48px');
  position: relative;
}
</style>
