<template>
<div>
  <label>{{ property.description }}</label>
  <select
    @change="setValue"
    :disabled="!property.enabled">
    <option
      v-for="option in property.options"
      :value="option.value"
      :selected="option.value === property.value.value">
      {{ option.name }}
    </option>
  </select>
</div>
</template>

<script>
import Property from './Property.vue';
let ListProperty = Property.extend({

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
ListProperty.obsType = 'OBS_PROPERTY_LIST';
export default ListProperty;

</script>
