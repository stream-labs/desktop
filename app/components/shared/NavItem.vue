<template>
<li
  class="nav-item"
  :class="{ active: to === value, disabled: enabled == false }"
  @click="onClickHandler"
>
  <i v-if="ico" :class="'fa fa-' + ico"></i>
  <slot></slot>
</li>
</template>

<script>

export default {
  props: {
    to: { type: String },
    ico: { type: String },
    enabled: { type: Boolean, default: true }
  },

  computed: {
    value() { return this.$parent.value }
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
@import "../../styles/index";

.nav-item {
  cursor: pointer;
  list-style: none;
  border-left: 4px solid transparent;
  padding-left: 50px;
  opacity: 0.7;
  font-size: 14px;
  margin-bottom: 5px;

  &.active {
    opacity: 1;
    font-weight: bold;
    border-color: @yellow;
    .fa {
      color: @yellow;
    }
  }
  &:hover {
    opacity: 1;
  }
  &.disabled {
    opacity: 0.3;
    cursor: default;
  }

  .fa {
    color: #999;
    position: relative;
    margin-right: -15px;
    left: -25px;
  }
}

</style>
