<template>
  <ul class="selector-list" @contextmenu="handleContextMenu()" data-test="Selector">
    <draggable :list="normalizedItems" :draggable="draggableSelector" @change="handleChange">
      <li
        v-for="(item, index) in normalizedItems"
        :key="item.value"
        class="selector-item"
        :class="{ 'selector-item--active': activeItems.includes(item.value) }"
        @contextmenu.stop="ev => handleContextMenu(ev, index)"
        @click="ev => handleSelect(ev, index)"
        @dblclick="ev => handleDoubleClick(ev, index)"
      >
        <div class="selector-item-text" :data-test="item.name">
          <span class="layer-icon"><i class="icon-studio-mode" /></span>
          <span class="item-title">{{ item.name }}</span>
        </div>
        <div class="selector-actions">
          <slot name="actions" :item="item" />
        </div>
      </li>
    </draggable>
  </ul>
</template>

<script lang="ts" src="./Selector.vue.ts"></script>

<style lang="less" scoped>
@import url('../styles/index');

.sortable-ghost {
  background-color: var(--color-bg-active);
  background-image: none;
  opacity: 0.7;
}

.sortable-chosen {
  background-color: var(--color-bg-active);
  background-image: none;
  opacity: 0.7;
}

.sortable-drag {
  background-color: var(--color-bg-active);
  border: 1px solid var(--color-border-light);
}

.selector-list {
  margin: 0;
  overflow: auto;
  list-style-type: none;
}

.selector-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: @item-generic-size;
  padding: 0 12px;
  cursor: pointer;

  .text-ellipsis;
  .transition;

  &.selector-item--active {
    color: var(--color-text-light);
    background-color: var(--color-bg-active);
  }

  &:hover {
    color: var(--color-text-light);

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
  opacity: 0.2;
}

.selector-drag-handle {
  cursor: move;
  .icon-hover;
}
</style>
