<template>
  <popper trigger="click" :options="{ placement: placement || 'bottom-start' }">
    <scrollable className="popper dropdown-menu" :isResizable="false" :autoSizeCapable="true">
      <slot></slot>
    </scrollable>

    <button slot="reference" class="dropdown-menu__toggle">
      <span>{{ title }}</span> <i :class="icon || 'icon-dropdown'" />
    </button>
  </popper>
</template>

<script lang="ts" src="./DropdownMenu.vue.ts"></script>

<style lang="less">
@import '../../styles/index';

.dropdown-menu {
  .radius();
  .padding();
  .shadow();

  top: 5px !important;
  background-color: var(--background);
  max-height: 166px;
  z-index: 200000;
}

.dropdown-menu__toggle {
  .weight(@medium);

  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--title);
  background-color: transparent;
  border: none;
  min-width: 0;

  span {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fa,
  i {
    .margin-left();
    .icon-hover();

    padding: 3px; // easier to click
  }

  &:focus {
    outline: 0;
  }
}

.dropdown-menu__separator {
  .margin-v-sides();

  width: 100%;
  height: 1px;
  background-color: var(--midtone);
  opacity: 0.2;
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

  &.dropdown-menu__disabled {
    &:hover,
    &.active {
      color: var(--midtone);
    }
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

.popper[x-placement^='top'] {
  margin-bottom: 5px;
}

.popper[x-placement^='bottom'] {
  margin-top: 5px;
}

.popper[x-placement^='right'] {
  margin-left: 5px;
}

.popper[x-placement^='left'] {
  margin-right: 5px;
}
</style>
