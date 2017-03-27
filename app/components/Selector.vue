<template>
<ul class="Selector-list">
  <draggable
    :list="normalizedItems"
    :options="{}"
    @change="handleChange">
    <li
      class="Selector-item"
      :class="{ 'Selector-item__active': item.value === activeItem }"
      v-for="(item, index) in normalizedItems"
      @click="handleSelect(index)">
      <div class="Selector-itemText">
        {{item.name}}
      </div>
      <div class="Selector-dragHandle">
        <i class="fa fa-bars fa-rotate-90"/>
      </div>
    </li>
  </draggable>
</ul>
</template>

<script>
import Draggable from 'vuedraggable';

export default {
  props: ['items', 'activeItem'],

  components: {
    Draggable
  },

  methods: {
    handleChange() {
      let order = _.map(this.normalizedItems, item => {
        return item.value;
      });

      this.$emit('sort', order);
    },

    handleSelect(index) {
      let value = this.normalizedItems[index].value;

      this.$emit('select', value);
    }
  },

  computed: {
    // Items can be either an array of strings, or an
    // array of objects, so we normalize those here.
    normalizedItems() {
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
}
</script>

<style lang="less" scoped>
.sortable-ghost {
  opacity: 0;
}

.sortable-drag {
  border: 1px solid #ddd;
  background-color: #eee;
}

.Selector-list {
  list-style-type: none;
  margin: 0;
  overflow: auto;
  border: 1px solid #ddd;

  background-color: #fcfcfc;
}

.Selector-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #ddd;

  cursor: pointer;

  &.Selector-item__active {
    background-color: #1ae6a8;
    color: white;

    .Selector-dragHandle {
      color: white;
    }
  }

  &:hover {
    .Selector-dragHandle {
      opacity: 1;
    }
  }
}

.Selector-itemText {
  flex-grow: 1;
}

.Selector-dragHandle {
  color: #ccc;
  cursor: move;
  font-size: 12px;
  padding: 0 5px;
  opacity: 0;
}
</style>
