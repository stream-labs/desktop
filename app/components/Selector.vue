<template>
<ul class="selector-list" @contextmenu="handleContextMenu()" data-test="Selector">
  <draggable
    :list="normalizedItems"
    :options="{draggable: draggableSelector}"
    @change="handleChange">
    <li
      class="selector-item"
      :class="{ 'selector-item--active': activeItems.includes(item.value) }"
      v-for="(item, index) in normalizedItems"
      :key="item.name"
      @contextmenu.stop="(ev) => handleContextMenu(ev, index)"
      @click="(ev) => handleSelect(ev, index)"
      @dblclick="(ev) => handleDoubleClick(ev, index)">
      <div class="selector-item-text" :data-test="item.name">
        <span class="layer-icon"><i class="icon-studio-mode"/></span>{{item.name}}
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
@import "../styles/_colors";
@import "../styles/mixins";

.sortable-ghost {
  opacity: .7;
  background-image: none;
  background: @accent-light;
}

.sortable-chosen {
  opacity: .7;
  background-image: none;
  background: @accent-light;
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
  padding: 4px 8px;
  cursor: pointer;
  justify-content: space-between;
  color: @text-secondary;
  .transition;
  margin-top: -1px;

  &:hover {
    color: @text-primary;
  }
  &.selector-item--active {
    background-color: @hover;
    color: @text-primary;
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
  width: 16px;
  margin-right: 4px;

  i {
    font-size: 12px;
    font-weight: 700;
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

</style>
