<template>
<div>
  <div>
    <ul class="tab-container">
      <li
        v-for="(tab, i) in tabs"
        :key="i"
        class="tab"
        :class="{ 'active': tab.value === value, first: i === 0, last: i === tabs.length - 1 }"
        @click="showTab(tab.value)">
        {{ tab.name }}
      </li>
    </ul>
  </div>
  <div>
    <slot v-for="tab in tabs" :name="tab.value" v-if="tab.value === value"/>
  </div>
</div>
</template>

<script lang="ts" src="./Tabs.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.tab-container {
  display: flex;
  flex-direction: row;
  list-style-type: none;
  margin: 0;
}

.tab {
  flex-grow: 1;
  text-align: center;
  padding: 10px 0;
  cursor: pointer;
  box-sizing: border-box;
  border-radius: 3px 3px 0 0;
  border: 1px solid @day-border;
  &.active {
    border-bottom: none;
  }
  &.first {
    border-left: none;
  }
  &.last {
    border-right: none;
  }
}

.night-theme .tab {
  border-color: @night-accent-light;
}
</style>
