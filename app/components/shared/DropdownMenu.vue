<template>
  <popper
    trigger="click"
    :options="{ placement: (placement || 'bottom-start') }"
  >
    <div class="popper dropdown-menu">
      <slot></slot>
    </div>

    <button slot="reference" class="dropdown-menu__toggle">
      <span>{{ title }}</span> <i :class="icon || 'icon-down'"/>
    </button>

  </popper>
</template>

<script lang="ts" src="./DropdownMenu.vue.ts"></script>

<style lang="less">
@import "../../styles/index";
.dropdown-menu {
  top: 5px !important;
  background-color: @day-primary;
  .radius();
  padding: 10px;
  max-height: 166px;
  overflow-y: auto;
  z-index: 200000;
  .day-shadow();
}

.dropdown-menu__toggle {
  display: flex;
  align-items: center;
  text-transform: capitalize;
  font-size: 14px;
  .weight(@medium);
  color: @day-title;

  span {
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fa,
  i {
    margin-left: 8px;
    font-size: 10px;
    padding: 3px; // easier to click
    .icon-hover();

    &.icon-down {
      font-size: 6px;
    }
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
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
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
    .night-shadow();
  }

  .dropdown-menu__toggle {
    .fa,
    i {
      .night-icon-hover();
    }

    &:focus {
      outline: 0;
    }
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
}

.popper[x-placement^="top"] {
  margin-bottom: 5px;
}

.popper[x-placement^="bottom"] {
  margin-top: 5px;
}

.popper[x-placement^="right"] {
  margin-left: 5px;
}

.popper[x-placement^="left"] {
  margin-right: 5px;
}
</style>


