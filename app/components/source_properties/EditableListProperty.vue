<template>
<div>
  <label>{{ property.description }}</label>
  EDITABLE LIST
</div>
</template>

<script>
export default {

  props: [
    'property'
  ],

  methods: {
    setValue(event) {
      // this.$store.dispatch({
      //   type: 'setSourceProperty',
      //   property: this.property,
      //   propertyValue: {
      //     value: event.target.value
      //   }
      // });
    }
  }

};
</script>
