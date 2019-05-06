<template>
<ul class="selector-list" @contextmenu="handleContextMenu()">
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
      <div class="selector-item-text">{{item.name}}</div>
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
  opacity: 0.7;
  background-image: none;
}

.sortable-chosen {
  opacity: 0.7;
  background-image: none;
}

.sortable-drag {
  border-color: var(--input-border);
}

.selector-list {
  .radius();

  list-style-type: none;
  margin: 0;
  overflow: auto;
}

.selector-item {
  .padding-h-sides(2);
  .transition();

  display: flex;
  flex-direction: row;
  align-items: center;
  line-height: 30px;
  cursor: pointer;
  justify-content: space-between;
  color: var(--paragraph);
  border: 1px solid transparent;

  &.selector-item--active {
    background-color: var(--solid-input);
    color: var(--title);
    .weight(@medium);

    .selector-actions {
      opacity: 1;
    }
  }

  &:hover {
    .selector-actions {
      opacity: 1;
    }
  }
}

.selector-item-text {
  text-overflow: ellipsis;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
}

.selector-actions {
  display: flex;
  flex-direction: row;
  font-size: 13px;
  opacity: 0.2;
}

.selector-drag-handle {
  cursor: move;
  .icon-hover();
}
</style>
