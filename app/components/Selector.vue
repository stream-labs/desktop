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
      <div class="selector-item__title">{{item.name}}</div>
      <div class="selector-item__actions">
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
  opacity: 0;
  background-image: none;
}

.sortable-chosen {
  opacity: .7;
  background-image: none;
}

.sortable-drag {
  border: 1px solid @day-input-border;
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

  .selector-item--active {
    background-color: @night-hover;
    color: @white;
  }
}
</style>
