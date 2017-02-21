<template>
<div>
  <div>
    <ul class="Tabs-tabContainer">
      <li
        class="Tabs-tab"
        :class="{ 'Tabs-tab__active': tab.value === selected }"
        v-for="tab in tabs"
        @click="showTab(tab.value)">
        {{ tab.name }}
      </li>
    </ul>
  </div>
  <div class="Tabs-contentContainer">
    <slot v-for="tab in tabs" :name="tab.value" v-if="tab.value === selected"/>
  </div>
</div>
</template>

<script>
export default {

  props: ['tabs'],

  data() {
    return {
      selected: this.tabs[0].value
    }
  },

  methods: {
    showTab(tab) {
      this.selected = tab;
    }
  }

};
</script>

<style lang="less" scoped>
.Tabs-tabContainer {
  display: flex;
  flex-direction: row;

  list-style-type: none;
  margin: 0;
}

.Tabs-tab {
  flex-grow: 1;
  text-align: center;
  padding: 10px 0;
  cursor: pointer;
  box-sizing: border-box;

  border: 1px solid rgba(0,0,0,0);
  border-bottom: 1px solid #ccc;

  &.Tabs-tab__active {
    border: 1px solid #ccc;
    border-bottom: 1px solid rgba(0,0,0,0);
  }
}

.Tabs-contentContainer {
  padding: 10px;
  border: 1px solid #ccc;
  border-top: 0;
}
</style>
