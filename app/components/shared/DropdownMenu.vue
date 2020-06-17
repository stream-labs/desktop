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
  width: 124%;
  position: absolute;
  background-color: @bg-secondary;
  border-color: @bg-primary;
  .border;
  .radius;
  padding: 8px;
  max-height: 152px;
  overflow-y: auto;
  z-index: 200000;
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
  text-align: left;
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  color: @text-secondary;

  &:hover,
  &.active {
    color: @text-primary;
    background-color: @bg-primary;
    &:before {
      content:"\003e";
    }
  }
}

</style>


