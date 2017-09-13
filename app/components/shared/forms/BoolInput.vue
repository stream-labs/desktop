<template>
<div class="input-container" :class="{disabled: value.enabled == false}">
  <div class="input-label">
  </div>
  <div class="input-wrapper">
    <div class="checkbox">
      <input
        type="checkbox"
        :checked="value.value"
        :disabled="value.enabled == false"
        @change="onChangeHandler"
      />
      <label>{{ value.description }}</label>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { Input, IFormInput, TObsType } from './Input';

@Component
class BoolInput extends Input<IFormInput<boolean>> {

  static obsType: TObsType;

  @Prop()
  value: IFormInput<boolean>;

  onChangeHandler(event: Event) {
    this.emitInput({ ...this.value, value: !!event.target['checked'] });
  }

}

BoolInput.obsType = 'OBS_PROPERTY_BOOL';

export default BoolInput;
</script>
