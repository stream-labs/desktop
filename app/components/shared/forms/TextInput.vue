<template>
  <div>
    <label>{{ value.description }}</label>
    <input
      type="text"
      v-model="value.currentValue"
    />
  </div>
</template>

<script>

import Input from './Input.vue';
let TextInput = Input.extend({});
TextInput.obsType = 'OBS_PROPERTY_EDIT_TEXT';
export default TextInput;

</script>
