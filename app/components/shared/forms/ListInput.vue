<template>
<div class="input" :class="{disabled: value.enabled === false}">
  <label>{{ value.description }}</label>
  <select
    :disabled="value.enabled === false"
    @input="onInputHandler"
  >
    <option
      v-for="possibleValue in value.options"
      :value="possibleValue.value"
      :selected="possibleValue.value === value.value">
      {{ possibleValue.description }}
    </option>
  </select>
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IListInputValue, Input } from './Input';


@Component
class ListInput extends Input<IListInputValue> {

  static obsType: TObsType;

  @Prop()
  value: IListInputValue;

  onInputHandler(event: Event) {
    this.emitInput({ ...this.value, value: event.target['value'] });
  }

}

ListInput.obsType = 'OBS_PROPERTY_LIST';

export default ListInput;
</script>
