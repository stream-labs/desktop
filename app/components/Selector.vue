<template>
<ul class="selector">
  <li
    v-for="item in normalizedItems"
    class="selector-item"
    :class="{ active: item.value === activeItem }"
    @click="$emit('select', item.value)">
    {{ item.name }}
  </li>
</ul>
</template>

<script>
export default {
  props: ['items', 'activeItem'],

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
.selector {
  list-style-type: none;
  margin: 0;
  overflow: auto;
  border: 1px solid #ddd;
  background-color: #fcfcfc;
}

.selector-item {
  padding: 4px 10px;
  cursor: pointer;

  &.active {
    background-color: #1ae6a8;
    color: white;
  }

  &:hover:not(.active) {
    background-color: #f6f6f6;
  }
}
</style>
