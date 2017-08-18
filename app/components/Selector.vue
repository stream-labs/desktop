<template>
<ul class="selector-list" @contextmenu="handleContextMenu()">
  <draggable
    :list="normalizedItems"
    :options="{}"
    @change="handleChange">
    <li
      class="selector-item"
      :class="{ 'selector-item--active': item.value === activeItem }"
      v-for="(item, index) in normalizedItems"
      @contextmenu.stop="handleContextMenu(index)"
      @click="handleSelect(index)"
      @dblclick="handleDoubleClick(index)">
      <div class="selector-item-text">
        {{item.name}}
      </div>
      <div class="selector-actions">
        <slot name="actions" :item="item"/>
        <i class="icon-btn fa fa-bars fa-rotate-90 selector-drag-handle"/>
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

  handleContextMenu(index?: number) {
    if (index !== void 0) {
      const value = this.normalizedItems[index].value;
      this.handleSelect(index);
      this.$emit('contextmenu', value);
      return;
    }
    this.$emit('contextmenu');
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
  color: @navy;
  .transition;

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
  opacity: 0;
}

.selector-drag-handle {
  cursor: move;
  .icon-hover;
}

.night-theme {
  .sortable-ghost, .sortable-chosen {
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
