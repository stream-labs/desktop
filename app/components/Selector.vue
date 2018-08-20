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
  .radius();
}

.selector-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-top: 4px;
  padding-bottom: 4px;
  .padding-right();
  .padding-left();
  cursor: pointer;
  justify-content: space-between;
  color: @day-paragraph;
  .transition();

  &.selector-item--active {
    background-color: @light-2;
    color: @day-title;

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
  .icon-hover();
}

.night-theme {
  .sortable-ghost,
  .sortable-chosen {
    background: @night-hover;
  }

  .selector-item {
    color: @grey;

    &.selector-item--active {
      background-color: @night-hover;
      color: @white;
    }
  }
}
</style>
