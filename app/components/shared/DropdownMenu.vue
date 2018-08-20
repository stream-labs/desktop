<template>
  <popper trigger="click" :options="{ placement: 'bottom-start' }">

    <div class="popper dropdown-menu">
      <slot></slot>
    </div>

    <button slot="reference" class="dropdown-menu__toggle">
      <span class="scene-name">{{ title }}</span><i class="icon-down-arrow"/>
    </button>

  </popper>
</template>

<script lang="ts" src="./DropdownMenu.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.dropdown-menu {
  width: 124%;
  position: absolute;
  top: 22px!important;
  left: 2px!important;
  background-color: @bg-secondary;
  border-color: @bg-primary;
  .border;
  .radius;
  padding: 8px;
  max-height: 152px;
  overflow-y: auto;
  transform: none!important;
}

.dropdown-menu__toggle {
  display: flex;
  text-align: left;
  align-items: center;
  font-size: 12px;
  .semibold;
  letter-spacing: .7px;
  color: @text-primary;

  i {
    margin-left: 6px;
    font-size: 10px;
    color: @text-secondary;
    &:hover {
      color: @text-primary;
    }
  }

  > .scene-name {
    display: inline-block;
    width: 160px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:hover,
    &.active {
      color: @text-primary;
    }
  }
}

.dropdown-menu__item {
  white-space: nowrap;
  cursor: pointer;
  color: @text-secondary;

  &:hover,
  &.active {
    color: @text-primary;
    background-color: @bg-primary;
    &:before {
      content:"\003e";
      position: relative;
      top: 0;
      left: -10px;
    }
  }
}

</style>
