<template>
  <ul class="nav-menu">
    <slot></slot>
  </ul>
</template>

<script>
export default {
  props: ['value'],
  methods: {
    setValue(value) {
      this.$emit('input', value)
    }
  }
};
</script>

<style lang="less" scoped>
@import "../../styles/index";
.nav-menu {
  margin: 0;
  width: 200px;
  border-right: 1px solid @day-border;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  background: #f7f9f9;
  margin-top: -20px;
  padding-top: 20px;
}
.night-theme {
  .nav-menu {
    border-color: @night-border;
    background-color: @night-primary;
  }
}
</style>
