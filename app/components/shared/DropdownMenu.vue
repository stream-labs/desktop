<template>
  <popper trigger="click" :options="{ placement: 'bottom-start' }">

    <div class="popper dropdown-menu">
      <slot></slot>
    </div>

    <button slot="reference" class="dropdown-menu__toggle">
      {{ title }} <i class="fa fa-chevron-down"/>
    </button>

  </popper>
</template>

<script lang="ts" src="./DropdownMenu.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.dropdown-menu {
  position: absolute;
  top: 20px!important;
  background-color: @day-primary;
  .border;
  .radius;
  padding: 10px;
  max-height: 166px;
  overflow-y: auto;
  transform: none!important;
}

.dropdown-menu__toggle {
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 12px;
  .semibold;
  color: @grey;
  letter-spacing: .7px;

  .fa {
    margin-left: 6px;
    font-size: 9px;
    margin-top: -2px;
  }
}

.dropdown-menu__separator {
  width: 100%;
  height: 1px;
  background-color: @grey;
  opacity: .2;
  margin: 10px 0;
}

.dropdown-menu__item {
  white-space: nowrap;
  cursor: pointer;
  color: @grey;

  &:hover,
  &.active {
    color: @navy;
  }
}

.night-theme {
  .dropdown-menu {
    background-color: @night-primary;
    border-color: @night-secondary;
  }

  .dropdown-menu__item {
    &:hover,
    &.active {
      color: @white;
    }
  }
}
</style>
