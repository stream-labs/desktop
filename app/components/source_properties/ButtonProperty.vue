<template>
<div>
  <button
    class="button button--action ButtonProperty-button"
    @click="handleClick">
    {{ property.value.description }}
  </button>
</div>
</template>

<script>
export default {

  props: [
    'property'
  ],

  methods: {
    handleClick() {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: {}
      });
    }
  }

};
</script>

<style lang="less" scoped>
.ButtonProperty-button {
  margin: 15px 0;
}
</style>
