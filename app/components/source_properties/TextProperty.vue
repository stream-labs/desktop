<template>
<div>
  <label>{{ property.description }}</label>
  <textarea
    rows="5"
    :value="property.value"
    :disabled="!property.enabled"
    @input="setValue"/>
</div>
</template>

<script>
export default {

  props: [
    'property'
  ],

  methods: {
    setValue: _.debounce(function(event) {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: event.target.value
      });
    }, 500)
  }

};
</script>
