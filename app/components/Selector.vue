<template>
<ul class="selector-list" @contextmenu="handleContextMenu()" data-test="Selector">
  <draggable
    :list="normalizedItems"
    :options="{draggable: draggableSelector}"
    @change="handleChange">
    <li
      v-for="(item, index) in normalizedItems"
      :key="item.value"
      class="selector-item"
      :class="{ 'selector-item--active': activeItems.includes(item.value) }"
      @contextmenu.stop="(ev) => handleContextMenu(ev, index)"
      @click="(ev) => handleSelect(ev, index)"
      @dblclick="(ev) => handleDoubleClick(ev, index)">
      <div class="selector-item-text" :data-test="item.name">
        <span class="layer-icon"><i class="icon-studio-mode"/></span>
        <span class="item-title">{{item.name}}</span>
      </div>
      <div class="selector-actions">
        <slot name="actions" :item="item"/>
      </div>
    </li>
  </draggable>
</ul>
</template>

<script lang="ts" src="./Selector.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.sortable-ghost {
  opacity: .7;
  background-image: none;
  background-color: var(--color-bg-active);
}

.sortable-chosen {
  opacity: .7;
  background-image: none;
  background-color: var(--color-bg-active);
}
.sortable-drag {
  border: 1px solid var(--color-border-light);
  background-color: var(--color-bg-active);
}

.selector-list {
  list-style-type: none;
  margin: 0;
  overflow: auto;
}

.selector-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 30px;
  padding: 4px 12px;
  cursor: pointer;
  justify-content: space-between;

  .text-ellipsis;
  .transition;

  &:hover {
    color: var(--color-text-light);
  }
  &.selector-item--active {
    background-color: var(--color-bg-active);
    color: var(--color-text-light);
  }

  &:hover {
    .selector-actions {
      opacity: 1;
    }
  }
}

.layer-icon {
  display: inline-block;
  text-align: left;

  i {
    font-size: @font-size2;
  }
}
.selector-item-text {
  .text-ellipsis;
  display: flex;
  align-items: center;
}

.selector-actions {
  display: flex;
  flex-direction: row;
  font-size: 13px;
  opacity: .2;
}

.selector-drag-handle {
  cursor: move;
  .icon-hover;
}

</style>
