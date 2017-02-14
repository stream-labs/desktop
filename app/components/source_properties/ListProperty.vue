<template>
<div>
  <label>{{ property.name }}</label>
  <select @change="setValue">
    <option
      v-for="option in property.options"
      :value="option"
      :selected="option === propertyValue">
      {{ option }}
    </option>
  </select>
</div>
</template>

<script>
export default {

  props: [
    'sourceName',
    'property'
  ],

  methods: {
    setValue(event) {
      this.$store.dispatch({
        type: 'setSourceProperty',
        sourceName: this.sourceName,
        propertyName: this.property.name,
        propertyValue: event.target.value
      });
    }
  },

  computed: {
    propertyValue() {
      return this.$store.state.sources.sources[this.sourceName].
        propertyValues[this.property.name];
    }
  }

};
</script>
