<template>
<div class="checkbox">
  <input
    type="checkbox"
    :checked="property.value.value"
    :disabled="!property.enabled"
    @change="setValue"/>
  <label>{{ property.description }}</label>
</div>
</template>

<script>

import Property from './Property.vue';

let BoolProperty = Property.extend({
  methods: {
    setValue(event) {

//      this.$store.dispatch({
//        type: 'setSourceProperty',
//        property: this.property,
//        propertyValue: {
//          value: event.target.checked.toString()
//        }
//      });
    }
  }
});

BoolProperty.obsType = 'OBS_PROPERTY_BOOL';

export default BoolProperty;



</script>
