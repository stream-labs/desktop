<template>
<div class="input">
  <label>{{ value.description }}</label>
  <select
    :disabled="value.enabled === 0"
    @input="onInputHandler"
  >
    <option
      v-for="possibleValue in value.values"
      :value="getName(possibleValue)"
      :selected="getName(possibleValue) === value.currentValue">
      {{ getDescription(possibleValue) }}
    </option>
  </select>
</div>
</template>

<script>
import Input from './Input.vue';
import SettingsService from '../../../services/settings';

const ListInput = Input.extend({

  methods: {

    onInputHandler(event) {
      this.$emit('input', Object.assign({}, this.value, {
        currentValue: event.target.value
      }));
    },

    getDescription: SettingsService.getListItemDescription,
    getName: SettingsService.getListItemName
  }
});

ListInput.obsType = 'OBS_PROPERTY_LIST';

export default ListInput;
</script>
