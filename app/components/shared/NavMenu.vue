<template>
<ul class="NavMenu">
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

  .NavMenu {
    margin: 0;
  }
</style>
