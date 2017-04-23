<template>
<div>
  <label>{{ property.description }}</label>
  <input
    type="text"
    :value="property.value.value.toFixed(2)"
    :disabled="!property.enabled"
    @change="setValue"/>
</div>
</template>

<script>


import Property from './Property.vue';

let FloatProperty = Property.extend({
  methods: {
    setValue(event) {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: {
          value: event.target.value
        }
      });
    }
  }
});
FloatProperty.obsType = 'OBS_PROPERTY_FLOAT';
export default FloatProperty;

</script>
