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

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IListInputValue, getListItemDescription, getListItemName } from './Input';


@Component
class ListInput extends Vue {

  static obsType: TObsType;

  @Prop()
  value: IListInputValue<string>;

  getDescription = getListItemDescription;
  getName = getListItemName;

  onInputHandler(event: Event) {
    this.$emit('input', Object.assign({}, this.value, {
      currentValue: event.target['value']
    }));
  }

};

ListInput.obsType = 'OBS_PROPERTY_LIST';

export default ListInput;
</script>
