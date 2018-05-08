<template>
<ul class="selector-list" @contextmenu="handleContextMenu()">
  <draggable
    :list="normalizedItems"
    :options="{draggable: draggableSelector}"
    @change="handleChange">
    <li
      class="selector-item"
      :class="{ 'selector-item--active': activeItems.includes(item.value) }"
      v-for="(item, index) in normalizedItems"
      @contextmenu.stop="(ev) => handleContextMenu(ev, index)"
      @click="(ev) => handleSelect(ev, index)"
      @dblclick="(ev) => handleDoubleClick(ev, index)">
      <div class="selector-item-text">
        {{item.name}}
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
}

.sortable-chosen {
  opacity: .7;
  background-image: none;
}

.sortable-drag {
  border: 1px solid #ddd;
  background-color: #eee;
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
  padding: 4px 12px;
  cursor: pointer;
  justify-content: space-between;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  color: @navy;
  .transition;
  margin-top: -1px;

  &.selector-item--active {
    background-color: @white;
    border-color: @day-border;
    color: @navy-secondary;

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
  opacity: .2;
}

.selector-drag-handle {
  cursor: move;
  .icon-hover;
}

.night-theme {
  .sortable-ghost,
  .sortable-chosen {
    background: @night-accent-light;
  }

  .selector-item {
    color: @grey;

    &.selector-item--active {
      background-color: @night-hover;
      border-color: transparent;
      color: @white;
    }
  }
}
</style>
