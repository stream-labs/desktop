<template>
<div>
  <label>{{ property.name }}</label>
  <input
    type="checkbox"
    :checked="propertyValue"
    @change="setValue"/>
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
        propertyValue: event.target.checked
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
