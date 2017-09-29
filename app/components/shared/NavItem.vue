<template>
<li
  class="nav-item"
  :class="{ active: to === value, disabled: enabled == false }"
  @click="onClickHandler"
>
  <i v-if="ico" :class="'fa fa-' + ico" @click="onIconClickHandler"></i>
  <slot></slot>
</li>
</template>

<script lang="ts" src="./NavItem.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.nav-item {
  cursor: pointer;
  list-style: none;
  border-left: 3px solid transparent;
  padding-left: 50px;
  opacity: 0.7;
  font-size: 14px;
  margin-bottom: 5px;

  &.active {
    opacity: 1;
    .semibold;
    border-color: @yellow;
    color: @navy;

    .fa {
      color: @yellow;
    }
  }

  &:hover {
    opacity: 1;
  }

  &.disabled {
    opacity: 0.3;
    cursor: default;
  }

  .fa {
    color: #999;
    position: relative;
    margin-right: -15px;
    left: -25px;
  }
}
.night-theme {
  .nav-item {
    &.active {
      color: @white;
    }
  }
}

</style>
