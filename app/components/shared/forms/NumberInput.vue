<template>
<div class="input">
  <label>{{ value.description }}</label>
  <input
    ref="input"
    type="text"
    :value="value.currentValue"
    :disabled="!value.enabled"
    @input="updateValue($event.target.value)"
  />
</div>
</template>

<script>
import Input from './Input.vue';

let NumberInput = Input.extend({
  methods: {
    updateValue: function (value) {
      let formattedValue = value;
      if (isNaN(Number(formattedValue))) formattedValue = 0;
      if (formattedValue !== value) {
        this.$refs.input.value = formattedValue
      }
      // Emit the number value through the input event
      this.$emit('input', Object.assign(this.value, {currentValue: Number(formattedValue)}));
    }
  }
});
NumberInput.obsType = 'OBS_PROPERTY_DOUBLE';

export default NumberInput;
</script>
