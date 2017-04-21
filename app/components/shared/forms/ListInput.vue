<template>
  <div>
    <label>{{ value.description }}</label>
    <select
      v-model="value.currentValue"
      :disabled="!value.enabled">
      <option v-for="possibleValue in value.values">
        {{ possibleValue }}
      </option>
    </select>
  </div>
</template>

<script>
  import Input from './Input.vue';
  let ListInput = Input.extend({});
  ListInput.obsType = 'OBS_PROPERTY_LIST';
  export default ListInput;

</script>
