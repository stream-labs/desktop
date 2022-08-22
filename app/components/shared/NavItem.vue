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
  color: var(--color-text);
  padding: 0;
  font-size: @font-size4;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 40px;
  padding-left: 16px;

  &.nav-item--child {
    padding-left: 0;
    border-left: 0;
  }

  &.active {
    color: var(--color-text-active);

    i {
      color: var(--color-text-active);
    }
  }

  &:not(.active):hover {
    color: var(--color-text-light);

    i {
      color: var(--color-text-light);
    }
  }


  &.disabled {
    color: var(--color-text-disabled);
    cursor: default;
  }

  i {
    font-size: @font-size4;
    margin-right: 16px;
  }
}

.nav-item__content {
  overflow: hidden;
  // max-width: calc(~"100% - 20px");
  width: 100%;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 14px;
}

.nav-item__children {
  .margin-top();
}
</style>
