<template>
    <li class="nav-item" :class="{ active: to === value }" @click="onClickHandler">
      <slot></slot>
    </li>
</template>

<script>

export default {
  props: ['ico', 'to'],

  computed: {
    value() {return this.$parent.value}
  },

  updateValue() {
    this.$set('value', this.$parent.value)
  },

  methods: {

    onClickHandler() {
      this.$parent.setValue(this.to)
    },

  }
};
</script>

<style lang="less" scoped>

  .nav-item {
    cursor: default;
    list-style: none;
    &.active {
      font-weight: bold;
    }
  }

</style>
