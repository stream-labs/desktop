<template>
<div>
  <label>{{ property.name }}</label>
  <select @change="setValue">
    <option
      v-for="option in property.options"
      :value="option"
      :selected="option === property.value">
      {{ option }}
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
