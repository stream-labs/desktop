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
import SourcesService from '../../services/sources';

const BoolProperty = Property.extend({
  methods: {
    setValue(event) {
      SourcesService.instance.setProperty(
        this.property,
        { value: event.target.checked.toString() }
      );
    }
  }
});

BoolProperty.obsType = 'OBS_PROPERTY_BOOL';

export default BoolProperty;



</script>
