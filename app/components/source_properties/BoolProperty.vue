<template>
<div>
  <label>{{ property.name }}</label>
  <input
    type="checkbox"
    :checked="property.value"
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
        propertyValue: event.target.checked
      });
    }
  }

};
</script>
