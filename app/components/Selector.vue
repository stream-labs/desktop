<template>
<ul class="selector">
  <li
    v-for="item in items"
    class="selector-item"
    :class="{ active: item === activeItem }"
    @click="$emit('select', item)">
    {{ item }}
  </li>
</ul>
</template>

<script>
export default {
  props: ['items', 'activeItem']
}
</script>

<style lang="less" scoped>
.selector {
  list-style-type: none;
  margin: 0;
  overflow: auto;
  border: 1px solid gray;
}

.selector-item {
  padding: 4px 10px;
  cursor: pointer;

  &.active {
    background-color: #1ae6a8;
    color: white;
  }
}
</style>
