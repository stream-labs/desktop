<template>
  <div>
    <label>{{ value.description }}</label>
    <select
      v-model="value.currentValue"
      :disabled="!value.enabled"
      @input="$emit('input', value)"
    >
      <option v-for="possibleValue in value.values" :value="getName(possibleValue)">
        {{ getDescription(possibleValue) }}
      </option>
    </select>
  </div>
</template>

<script>
  import Input from './Input.vue';

  let ListInput = Input.extend({
    methods: {

      getDescription(possibleValue) {
        return possibleValue[Object.keys(possibleValue)[0]]
      },

      getName(possibleValue) {
        return Object.keys(possibleValue)[0]
      }
    }
  });
  ListInput.obsType = 'OBS_PROPERTY_LIST';

  export default ListInput;
</script>
