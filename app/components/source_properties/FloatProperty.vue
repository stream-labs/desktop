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
import SourcesService from '../../services/sources';

const FloatProperty = Property.extend({
  methods: {
    setValue(event) {
      SourcesService.instance.setProperty(
        this.property,
        { value: event.target.value }
      );
    }
  }
});
FloatProperty.obsType = 'OBS_PROPERTY_FLOAT';
export default FloatProperty;

</script>
