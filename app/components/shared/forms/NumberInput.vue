<template>
<div class="input">
  <label>{{ value.description }}</label>
  <input
    ref="input"
    type="text"
    :value="value.value"
    :disabled="!value.enabled"
    @input="updateValue($event.target.value)"
  />
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { IInputValue, TObsType, Input } from './Input';

@Component
class NumberInput extends Input<IInputValue<number>> {

  static obsType: TObsType[];

  @Prop()
  value: IInputValue<number>;

  $refs: {
    input: HTMLInputElement
  };

  updateValue(value: string) {
    let formattedValue = value;
    if (isNaN(Number(formattedValue))) formattedValue = '0';
    if (formattedValue !== value) {
      this.$refs.input.value = formattedValue;
    }
    // Emit the number value through the input event
    this.emitInput({ ...this.value, value: Number(formattedValue) });
  }
}
NumberInput.obsType = ['OBS_PROPERTY_DOUBLE', 'OBS_PROPERTY_FLOAT'];

export default NumberInput;
</script>
