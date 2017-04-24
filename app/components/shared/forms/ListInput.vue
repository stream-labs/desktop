<template>
  <div class="input">
    <label>{{ value.description }}</label>
    <select
      v-model="value.currentValue"
      :disabled="!value.enabled"
      @input="onInputHandler"
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

      onInputHandler(event) {
        this.$emit('input', Object.assign({}, this.value, {currentValue: event.target.value}))
      },

      getDescription(possibleValue) {
        return Object.keys(possibleValue)[0]
      },

      getName(possibleValue) {
        return possibleValue[Object.keys(possibleValue)[0]]
      }
    }
  });
  ListInput.obsType = 'OBS_PROPERTY_LIST';

  export default ListInput;
</script>
