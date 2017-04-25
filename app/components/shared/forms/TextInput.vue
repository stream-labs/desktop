<template>
<div class="input">
  <label>{{ value.description }}</label>
  <input
    type="text"
    :value="value.currentValue"
    :disabled="!value.enabled"
    @change="$emit('input', value)"
  />
</div>
</template>

<script>
import Input from './Input.vue';

let TextInput = Input.extend({});
TextInput.obsType = 'OBS_PROPERTY_EDIT_TEXT';
export default TextInput;

</script>
