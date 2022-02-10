<template>
  <div class="container">
    <div class="contentContainer">
      <slot :name="activeContent.slotName" />
    </div>
    <div class="header" v-if="!compactMode">
      <popper trigger="click" :options="{ placement: 'bottom-start' }">
        <div class="popper">
          <ul class="popup-menu-list">
            <li
              class="item"
              :class="{ active: content.slotName === activeContent.slotName }"
              :key="content.slotName"
              v-for="content in contents"
              @click="select(content.slotName)"
            >
              <p class="item-name">{{ content.name }}</p>
              <p class="item-text">{{ content.text }}</p>
            </li>
          </ul>
        </div>

        <div class="indicator" slot="reference">
          {{ activeContent.name }}
          <i class="icon-drop-down-arrow"></i>
        </div>
      </popper>
    </div>
  </div>
</template>

<script lang="ts" src="./AreaSwitcher.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.container {
  position: relative;
  display: flex;
  flex-direction: column;
}

.header {
  z-index: @z-index-default-content;
  position: absolute;
  top: 0;
  left: 0;

  height: 40px;
}

.indicator {
  .transition;
  display: flex;
  align-items: center;
  font-size: @font-size4;
  color: var(--color-text-light);
  height: 32px;
  line-height: 32px;
  margin: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;


  &:hover {
     background-color: var(--color-button-tertiary-hover);
  }

  > i {
    font-size: @font-size1;
    margin-left: 8px;
  }
}

.contentContainer {
  flex-grow: 1;

  display: flex;
  flex-direction: column;
}

.popper {
  .popper-styling;
  width: 320px;

  padding: 0;
  margin-left: 8px;

  .popup-menu-list {
    margin: 0;

    & > .item {
      text-align: left;
      position: relative;
      padding: 0 16px;
      height: 64px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      cursor: pointer;

      &.active {
        .bg-hover();
      }

      &:not(.active):hover {
        .bg-hover();
      }
    }

    .item-name {
      font-size: @font-size4;
      margin: 0 0 4px 0;
      color: var(--color-text-light);
    }

    .item-text {
      font-size: @font-size2;
      margin: 0;
      color: var(--color-text);
    }
  }
}
</style>
