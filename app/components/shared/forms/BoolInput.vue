<template>
<div class="checkbox">
  <input
    type="checkbox"
    v-model="value.currentValue"
    :true-value="1"
    :false-value="0"
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
