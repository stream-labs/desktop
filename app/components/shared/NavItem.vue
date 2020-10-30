<template>
<li
  class="nav-item"
  :class="{ active: to === value, disabled: enabled == false, 'nav-item--child': isSubItem }"
  @click="onClickHandler"
>
  <i v-if="ico" :class="ico" @click="onIconClickHandler"></i>
  <div class="nav-item__content">
    <slot></slot>
    <div v-if="expanded" class="nav-item__children">
      <slot name='children'></slot>
    </div>
  </div>
  <i v-if="expandable" :class="expanded ? 'icon-subtract' : 'icon-add'" />
</li>
</template>

<script lang="ts" src="./NavItem.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.nav-item {
  cursor: pointer;
  list-style: none;
  color: @text-secondary;
  padding: 12px 0 12px 36px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;

  &.nav-item--child {
    padding-left: 0;
    border-left: 0;
  }

  &.active {
    opacity: 1;
    color: @text-primary;
    .bg-active();
    .semibold;

    i {
      color: @text-primary;
    }
  }

  &:not(.active):not(.disabled):hover {
    .bg-hover();
  }

  &.disabled {
    opacity: 0.3;
    cursor: default;
  }

  i {
    position: relative;
    margin-right: -16px;
    left: -24px;
    width: 16px;
  }
}

.nav-item__content {
  overflow: hidden;
  // max-width: calc(~"100% - 20px");
  width: 100%;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item__children {
  .margin-top();
}
</style>
