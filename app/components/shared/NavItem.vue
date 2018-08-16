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
  border-left: 1px solid transparent;
  padding-left: 46px;
  font-size: 14px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-start;

  &.active {
    opacity: 1;
    .weight(@medium);
    border-color: @navy;
    color: @day-title;

    .fa,
    i {
      color: @day-title;
    }
  }

  &:hover {
    opacity: 1;
  }

  &.disabled {
    opacity: 0.3;
    cursor: default;
  }

  .fa,
  i {
    color: @icon;
    position: relative;
    margin-right: -16px;
    left: -24px;
    width: 20px;
  }
}

.nav-item__name {
  overflow: hidden;
  max-width: calc(~"100% - 20px");
  text-overflow: ellipsis;
  white-space: nowrap;
}

.night-theme {
  .nav-item {
    &.active {
      border-color: @white;
      color: @white;

      .fa,
      i {
        color: @white;
      }
    }
  }
}

</style>
