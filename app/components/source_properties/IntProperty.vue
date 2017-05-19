<template>
<div>
  <label>{{ property.description }}</label>
  <input
    type="text"
    :value="property.value.value"
    :disabled="!property.enabled"
    @change="setValue"/>
</div>
</template>

<script>
import Property from './Property.vue';
import SourcesService from '../../services/sources';

const IntProperty = Property.extend({

  methods: {
    setValue(event) {
      SourcesService.instance.setProperty(
        this.property,
        { value: Math.floor(event.target.value).toString() }
      );
    }
  }

});

IntProperty.obsType = 'OBS_PROPERTY_INT';
export default IntProperty;
</script>
