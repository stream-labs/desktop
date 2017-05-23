<template>
<div>
  <label>{{ property.description }}</label>
  <textarea
    rows="5"
    :value="property.value.value"
    :disabled="!property.enabled"
    @input="setValue"/>
</div>
</template>

<script>
import _ from 'lodash';
import Property from './Property.vue';
import SourcesService from '../../services/sources';

const TextProperty = Property.extend({

  methods: {
    setValue: _.debounce(function(event) {
      SourcesService.instance.setProperty(
        this.property,
        { value: event.target.value }
      );
    }, 500)
  }

});
TextProperty.obsType = 'OBS_PROPERTY_TEXT';
export default TextProperty;
</script>
