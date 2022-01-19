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
  background-color: var(--color-popper-bg-light);
  border-color: var(--color-border-light);
  .border;
  .radius;
  .shadow;
  
  padding: 8px;
  max-height: 152px;
  overflow-y: auto;
  z-index: @z-index-popper;
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
      
      color: var(--color-icon-hover);
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
  text-align: left;
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  color: var(--color-text);

  &:hover,
  &.active {
    color: var(--color-text-light);
    &:before {
      content:"\003e";
    }
  }
}

</style>


