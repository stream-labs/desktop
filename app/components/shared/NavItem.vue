<template>
    <li
      class="nav-item"
      :class="{ active: to === value, disabled: enabled == false }"
      @click="onClickHandler"
    >
      <slot></slot>
    </li>
</template>

<script>

export default {
  props: {
    to: {type: String},
    enabled: {type: Boolean, default: true}
  },

  computed: {
    value() {return this.$parent.value}
  },

  updateValue() {
    this.$set('value', this.$parent.value)
  },

  methods: {

    onClickHandler() {
      if (!this.enabled) return;
      this.$parent.setValue(this.to)
    },

  }
};
</script>

<style lang="less" scoped>

  .nav-item {
    cursor: default;
    list-style: none;
    border-left: 3px solid transparent;
    padding-left: 30px;
    &.active {
      font-weight: bold;
      border-color: #ffcd47;
    }
    &.disabled {
      opacity: 0.3;
    }
  }

</style>
