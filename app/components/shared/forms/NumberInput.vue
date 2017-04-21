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
let IntInput = Input.extend({});
IntInput.obsType = 'OBS_PROPERTY_INT';
export default IntInput;


</script>
