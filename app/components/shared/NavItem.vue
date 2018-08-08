<template>
<li
  class="nav-item"
  :class="{ active: to === value, disabled: enabled == false }"
  @click="onClickHandler"
>
  <i v-if="ico" :class="ico" @click="onIconClickHandler"></i>
  <span class="nav-item__name"><slot></slot></span>
</li>
</template>

<script lang="ts" src="./NavItem.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.nav-item {
  cursor: pointer;
  list-style: none;
  border-left: 4px solid transparent;
  padding: 8px 0 8px 36px;
  opacity: 0.7;
  font-size: 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;

  &.active {
    opacity: 1;
    background: @bg-secondary;
    .semibold;
    border-color: @text-primary;
    color: @text-primary;

    i {
      color: @text-primary;
    }
  }

  &:hover {
    opacity: 1;
    background: @bg-secondary;
  }

  &.disabled {
    opacity: 0.3;
    cursor: default;
  }

  i {
    position: relative;
    margin-right: -15px;
    left: -25px;
    width: 16px;
  }
}

.nav-item__name {
  overflow: hidden;
  max-width: calc(~"100% - 20px");
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>
