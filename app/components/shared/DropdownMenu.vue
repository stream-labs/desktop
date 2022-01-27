<template>
  <popper
    trigger="click"
    :options="{ placement: (placement || 'bottom-start') }"
  >
    <div class="popper dropdown-menu">
      <slot></slot>
    </div>

    <button slot="reference" class="dropdown-menu__toggle">
      <span class="scene-name">{{ title }}</span><i :class="icon || 'icon-drop-down-arrow'"/>
    </button>

  </popper>
</template>

<script lang="ts" src="./DropdownMenu.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

// 詳細度でライブラリ側の指定を上書きする
.popper.dropdown-menu {
  .popper-styling;
  max-height: 152px;
  overflow-y: auto;
  max-width: 400px;
}

.dropdown-menu__toggle {
  display: flex;
  text-align: left;
  align-items: center;
  font-size: @font-size4;
  .semibold;
  letter-spacing: .7px;
  color: var(--color-text);
  overflow: hidden;

  i {
    margin-left: 8px;
    font-size: @font-size1;
    .icon-hover();
  }

  &:hover {
    i {
      
      color: var(--color-text-light);
    }
  }

  > .scene-name {
    .text-ellipsis;

    display: inline-block;
    color: var(--color-text-light);
    font-size: @font-size4;
  }
}

.dropdown-menu__item {
  .text-ellipsis;
  width: 100%;
  line-height: 32px;
  padding: 0 8px;
  font-size: @font-size2;
  cursor: pointer;

  &:hover,
  &.active {
    color: var(--color-text-light);
    background-color: var(--color-bg-active);
  }

  &:last-child,
  &:last-of-type {
    margin-bottom: 8px;
  }

  .setting-link + & {
    border-top: 1px solid var(--color-border-light);
  }
}

</style>


