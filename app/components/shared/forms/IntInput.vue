<template>
<div :class="{disabled: !value.enabled}">
  <label>{{ value.description }}</label>
  <input
    ref="input"
    type="text"
    :value="value.currentValue"
    :disabled="value.enabled === 0"
    @input="updateValue($event.target.value)"
  />
</div>
</template>

<script>
import Input from './Input.vue';

let IntInput = Input.extend({
  methods: {
    updateValue: function (value) {
      let formattedValue = isNaN(parseInt(value)) ? 0 : parseInt(value);
      if (formattedValue !== value) {
        this.$refs.input.value = formattedValue
      }
      // Emit the number value through the input event
      this.$emit('input', Object.assign(this.value, {currentValue: Number(formattedValue)}));
    }
  }
});
IntInput.obsType = 'OBS_PROPERTY_INT';
export default IntInput;

</script>
