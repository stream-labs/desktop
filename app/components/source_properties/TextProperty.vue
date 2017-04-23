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
import Property from './Property.vue';
let TextProperty = Property.extend({

  methods: {
    setValue: _.debounce(function(event) {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: {
          value: event.target.value
        }
      });
    }, 500)
  }

});
TextProperty.obsType = 'OBS_PROPERTY_TEXT';
export default TextProperty;
</script>
