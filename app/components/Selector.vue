<template>
<ul class="selector-list">
  <draggable
    :list="normalizedItems"
    :options="{}"
    @change="handleChange">
    <li
      class="selector-item"
      :class="{ 'selector-item--active': item.value === activeItem }"
      v-for="(item, index) in normalizedItems"
      @contextmenu="handleContextMenu(index)"
      @click="handleSelect(index)"
      @dblclick="handleDoubleClick(index)">
      <div class="selector-item-text">
        {{item.name}}
      </div>
      <div class="selector-drag-handle">
        <i class="fa fa-bars fa-rotate-90"/>
      </div>
    </li>
  </draggable>
</ul>
</template>

<script lang="ts">
import Vue from 'vue';
import _ from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import draggable from 'vuedraggable';

interface ISelectorItem {
  name: string;
  value: string;
}


@Component({
  components: { draggable }
})
export default class Selector extends Vue {

  @Prop()
  items: ISelectorItem[];

  @Prop()
  activeItem: string;


  handleChange(change: any) {
    let order = _.map(this.normalizedItems, item => {
      return item.value;
    });

    this.$emit('sort', {
      change,
      order
    });
  }

  handleSelect(index: number) {
    let value = this.normalizedItems[index].value;
    this.$emit('select', value);
  }

  handleContextMenu(index: number) {
    const value = this.normalizedItems[index].value;
    this.handleSelect(index);
    this.$emit('contextmenu', value);
  }

  handleDoubleClick(index: number) {
    const value = this.normalizedItems[index].value;
    this.handleSelect(index);
    this.$emit('dblclick', value);
  }

  /**
   * Items can be either an array of strings, or an
   * array of objects, so we normalize those here.
   */
  get normalizedItems(): ISelectorItem[] {
    return _.map(this.items, item => {
      if (typeof(item) === 'string') {
        return {
          name: item,
          value: item
        };
      } else {
        return item;
      }
    });
  }
}
</script>

<style lang="less" scoped>
@import "../styles/index";
.sortable-ghost {
  opacity: .6;
  background-image: none;
}
.sortable-chosen {
  opacity: .6;
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
  border: 1px solid #ddd;
  background-color: #fcfcfc;
  .selector-item {
    &:first-child {
      border-top-color: transparent;
    }
  }
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
  &.selector-item--active {
    background-color: @white;
    border-color: @day-border;
    .selector-drag-handle {
      opacity: 1;
    }
  }

  &:hover {
    .selector-drag-handle {
      opacity: 1;
    }
  }
}

.Selector-itemText {
  flex-grow: 1;
}

.selector-drag-handle {
  color: @grey;
  cursor: move;
  font-size: 12px;
  padding: 0 0px 0 6px;
  opacity: 0;
}
.night-theme {
  .sortable-ghost, .sortable-chosen {
    background: @night-accent-light;
  }
}
</style>
