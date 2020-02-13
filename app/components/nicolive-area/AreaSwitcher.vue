<template>
  <div class="container">
    <div class="contentContainer">
      <slot :name="activeContent.slotName" />
    </div>
    <div class="header">
      <popper trigger="hover" :options="{ placement: 'bottom-end' }">
        <div class="popper">
          <ul class="selector">
            <li
              class="item"
              :class="{ active: content.slotName === activeContent.slotName }"
              :key="content.slotName"
              v-for="content in contents"
              @click="select(content.slotName)"
            >
              <i
                class="item-icon"
                :class="content.slotName === 'commentViewer' ? 'icon-comment' : 'icon-program-text'"
              ></i>
              <p class="item-name">{{ content.name }}</p>
              <p class="item-text">{{ content.text }}</p>
              <i class="icon-check" v-if="content.slotName === activeContent.slotName"></i>
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
@import "../../styles/_colors";
@import "../../styles/mixins";

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
  font-size: 12px;
  color: @white;
  margin: 8px;
  height: 32px;
  line-height: 32px;
  padding: 8px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
     .bg-hover();
  }

  > i {
    font-size: 10px;
    margin-left: 8px;
  }
}

.selector {
  border-radius: 4px;
  margin: 0 0 0 8px;
  padding: 8px 1px;
  width: 330px;
  background-color: @bg-primary;
  box-shadow: 0 0 4px rgba(@black, 0.5), inset 0 0 0 1px rgba(@white, 0.1);

  & > .item {
    list-style: none;
    height: 56px;
    position: relative;
    padding: 0 48px 0 48px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    cursor: pointer;

    &.active {
      .bg-active();
    }

    &:not(.active):hover {
      .bg-hover();
    }

    > i {
      position: absolute;
      transform: translateY(-50%);
      top: 50%;
    }
  }

  .item-name {
    font-size: 12px;
    margin: 0;
    color: @white;
  }

  .item-text {
    font-size: 10px;
    margin: 0;
    color: @light-grey;
  }

  .item-icon {
    font-size: 16px;
    left: 16px;
    color: @light-grey;
  }

  .icon-check {
    font-size: 12px;
    right: 16px;
    color: @accent;
  }
}

.contentContainer {
  flex-grow: 1;

  display: flex;
  flex-direction: column;
}
</style>
