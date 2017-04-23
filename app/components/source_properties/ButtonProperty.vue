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
import Property from './Property.vue';
let ButtonProperty = Property.extend({

  methods: {
    handleClick() {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: {}
      });
    }
  }
});

ButtonProperty.obsType = 'OBS_PROPERTY_BUTTON';

export default ButtonProperty;
</script>

<style lang="less" scoped>
.ButtonProperty-button {
  margin: 15px 0;
}
</style>
