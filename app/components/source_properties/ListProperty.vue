<template>
<div>
  <label>{{ property.description }}</label>
  <select
    @change="setValue"
    :disabled="!property.enabled">
    <option
      v-for="option in property.options"
      :value="option.value"
      :selected="option.value === property.value">
      {{ option.name }}
    </option>
  </select>
</div>
</template>

<script>
export default {

  props: [
    'property'
  ],

  methods: {
    setValue(event) {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: event.target.value
      });
    }
  }

};
</script>
