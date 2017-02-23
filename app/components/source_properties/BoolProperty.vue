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
          value: event.target.checked.toString()
        }
      });
    }
  }

};
</script>
