<template>
  <popper
    trigger="click"
    :options="{ placement: (placement || 'bottom-start') }"
  >
    <div class="popper dropdown-menu">
      <slot></slot>
    </div>

    <button slot="reference" class="dropdown-menu__toggle">
      <span>{{ title }}</span> <i :class="icon || 'icon-dropdown'"/>
    </button>

  </popper>
</template>

<script lang="ts" src="./DropdownMenu.vue.ts"></script>

<style lang="less">
@import "../../styles/index";
.dropdown-menu {
  top: 5px !important;
  background-color: var(--background);
  .radius();
  .padding();
  max-height: 166px;
  overflow-y: auto;
  z-index: 200000;
  .shadow();
}

.dropdown-menu__toggle {
  display: flex;
  align-items: center;
  text-transform: capitalize;
  font-size: 14px;
  .weight(@medium);
  color: var(--title);

  span {
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fa,
  i {
    .margin-left();
    padding: 3px; // easier to click
    .icon-hover();
  }

  &:focus {
    outline: 0;
  }
}

.dropdown-menu__separator {
  width: 100%;
  height: 1px;
  background-color: var(--midtone);
  opacity: .2;
  .margin-v-sides();
}

.dropdown-menu__item {
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  color: var(--midtone);

  &:hover,
  &.active {
    color: var(--title);
  }
}

.popper .popper__arrow {
  display: none !important;
}

.popper {
  border: 0 !important;
  padding: 8px !important;
  color: inherit !important;
  background-color: var(--background) !important;
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
