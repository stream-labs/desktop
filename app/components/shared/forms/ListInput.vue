<template>
<div class="input">
  <label>{{ value.description }}</label>
  <select
    :disabled="value.enabled === 0"
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
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IListInputValue } from './Input';


@Component
class ListInput extends Vue {

  static obsType: TObsType;

  @Prop()
  value: IListInputValue;

  onInputHandler(event: Event) {
    this.$emit('input', Object.assign({}, this.value, {
      value: event.target['value']
    }));
  }

}

ListInput.obsType = 'OBS_PROPERTY_LIST';

export default ListInput;
</script>
