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

  .nav-menu {
  }
</style>
