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
@import "../../styles/_colors";
@import "../../styles/mixins";

.nav-item {
  cursor: pointer;
  list-style: none;
  color: @text-secondary;
  padding: 12px 0 12px 36px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;

  &.active {
    opacity: 1;
    color: @text-primary;
    background: @bg-tertiary;
    .semibold;

    i {
       color: @text-primary;
    }
  }

  &:not(.active):hover {
    background: @bg-tertiary;
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
