<template>
  <popper class="dropdown-menu" trigger="click" :options="{ placement: 'bottom-start' }">

    <div class="popper dropdown-menu__menu">
      <slot class="popper dropdown-menu__menu"></slot>
    </div>

    <button slot="reference" class="dropdown-menu__toggle">
      {{ title }} <i class="icon-down"/>
    </button>

  </popper>
</template>

<script lang="ts" src="./DropdownMenu.vue.ts"></script>

<style lang="less">
@import "../../styles/index";
.dropdown-menu {
  position: relative;
}

.dropdown-menu__menu {
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
  font-size: 13px;
  .weight--medium;
  color: @day-title;

  .fa,
  i {
    margin-left: 8px;
    font-size: 6px;
  }

  &:focus {
    outline: 0;
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
  .dropdown-menu__menu {
    background-color: @night-primary;
    border-color: @night-secondary;
  }

  .dropdown-menu__item {
    &:hover,
    &.active {
      color: @white;
    }
  }

  .dropdown-menu__toggle {
    color: @white;
  }
}
</style>
