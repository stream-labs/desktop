<template>
  <popper
    trigger="click"
    :options="{ placement: (placement || 'bottom-start') }"
  >
    <div class="popper dropdown-menu">
      <slot></slot>
    </div>

    <button slot="reference" class="dropdown-menu__toggle">
      {{ title }} <i :class="icon || 'icon-down'"/>
    </button>

  </popper>
</template>

<script lang="ts" src="./DropdownMenu.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.dropdown-menu {
  top: 5px !important;
  background-color: @day-primary;
  .border;
  .radius;
  padding: 10px;
  max-height: 166px;
  overflow-y: auto;
  z-index: 200000;
}

.dropdown-menu__toggle {
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 13px;
  .semibold;
  color: @day-title;
  letter-spacing: .7px;

  .fa,
  i {
    margin-left: 6px;
    font-size: 6px;
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

  .dropdown-menu__toggle {
    color: @white;
  }
}

.popper .popper__arrow {
  display: none !important;
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 5px;
}

.popper[x-placement^="top"] {
  margin-bottom: 5px;
}

.popper[x-placement^="top"] .popper__arrow {
  border-width: 5px 5px 0 5px;
  border-color: #fafafa transparent transparent transparent;
  bottom: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.popper[x-placement^="bottom"] {
  margin-top: 5px;
}

.popper[x-placement^="bottom"] .popper__arrow {
  border-width: 0 5px 5px 5px;
  border-color: transparent transparent #fafafa transparent;
  top: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.popper[x-placement^="right"] {
  margin-left: 5px;
}

.popper[x-placement^="right"] .popper__arrow {
  border-width: 5px 5px 5px 0;
  border-color: transparent #fafafa transparent transparent;
  left: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.popper[x-placement^="left"] {
  margin-right: 5px;
}

.popper[x-placement^="left"] .popper__arrow {
  border-width: 5px 0 5px 5px;
  border-color: transparent transparent transparent #fafafa;
  right: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}


</style>


