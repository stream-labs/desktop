<template>
<div class="checkbox">
  <input
    type="checkbox"
    :checked="property.value"
    :disabled="!property.enabled"
    @change="setValue"/>
  <label>{{ property.description }}</label>
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
