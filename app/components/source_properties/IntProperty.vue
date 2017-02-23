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
export default {

  props: [
    'property'
  ],

  methods: {
    setValue(event) {
      this.$store.dispatch({
        type: 'setSourceProperty',
        property: this.property,
        propertyValue: {
          value: Math.floor(event.target.value).toString()
        }
      });
    }
  }

};
</script>
