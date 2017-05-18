<template>
<div :class="{disabled: !value.enabled}">
  <label>{{ value.description }}</label>
  <input
    ref="input"
    type="text"
    :value="value.value"
    :disabled="value.enabled === 0"
    @input="updateValue($event.target.value)"
  />
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { IInputValue, TObsType, Input } from './Input';

@Component
class IntInput extends Input<IInputValue<number>> {

  static obsType: TObsType;

  @Prop()
  value: IInputValue<number>;

  $refs: {
    input: HTMLInputElement
  };

  updateValue(value: string) {
    let formattedValue = String(isNaN(parseInt(value)) ? 0 : parseInt(value));
    if (formattedValue != value) {
      this.$refs.input.value = formattedValue
    }
    // Emit the number value through the input event
    this.emitInput({ ...this.value, value: Number(formattedValue) });
  }
}
IntInput.obsType = 'OBS_PROPERTY_INT';

export default IntInput;

</script>
