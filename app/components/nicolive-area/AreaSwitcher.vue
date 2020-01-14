<template>
<div class="container">
  <div class="contentContainer">
    <slot :name="activeContent.slotName"/>
  </div>
  <div class="header">
    <div class="indicator" @click="select(contents[(contents.findIndex(c => c.slotName === activeContent.slotName) + 1) % contents.length].slotName)">
      {{ activeContent.name }}
    </div>
    <ul class="selector">
      <li
        class="item"
        :class="{ active: content.slotName === activeContent.slotName }"
        :key="content.slotName"
        v-for="content in contents"
        @click="select(content.slotName)">
        {{ content.name }}
      </li>
    </ul>
  </div>
</div>
</template>

<script lang="ts" src="./AreaSwitcher.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";

.container {
  position: relative;
  display: flex;
  flex-direction: column;
}

.header {
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;

  height: 40px;
}

.indicator {
  color: @white;
  margin: 4px 16px;
  width: 80px;
  height: 32px;
  line-height: 32px;

  &::after {
    content: "▼";
    font-size: xx-small;
  }
}

.selector {
  display: none;
}

.contentContainer {
  flex-grow: 1;

  display: flex;
  flex-direction: column;
}

</style>
