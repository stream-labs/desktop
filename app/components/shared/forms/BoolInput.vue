<template>
<div class="input checkbox" :class="{disabled: !value.enabled}">
  <input
    type="checkbox"
    :value="value.currentValue"
    :true-value="1"
    :false-value="0"
    :disabled="!value.enabled"
    @change="$emit('input', value)"
  />
  <label>{{ value.description }}</label>
</div>
</template>

<script>

import Input from './Input.vue';
let BoolInput = Input.extend({});
BoolInput.obsType = 'OBS_PROPERTY_BOOL';
export default BoolInput;



</script>
