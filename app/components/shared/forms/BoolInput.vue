<template>
<div class="input checkbox" :class="{disabled: !value.enabled}">
  <input
    type="checkbox"
    :checked="value.value"
    :disabled="!value.enabled"
    @change="onChangeHandler"
  />
  <label>{{ value.description }}</label>
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { Input, IInputValue, TObsType } from './Input';


@Component
class BoolInput extends Input<IInputValue<boolean>> {

  static obsType: TObsType;

  @Prop()
  value: IInputValue<boolean>;

  onChangeHandler(event: Event) {
    this.emitInput({ ...this.value, value: !!event.target['checked'] });
  }
}

BoolInput.obsType = 'OBS_PROPERTY_BOOL';

export default BoolInput;

</script>
