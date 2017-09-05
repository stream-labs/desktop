<template>
  <div class="input-container">
    <div class="input-label">
    </div>
    <div class="input-wrapper">
      <button
        class="button button--action button-property-button"
        @click="handleClick">
        {{ value.description }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { Input, IFormInput, TObsType } from './Input';

@Component
class ButtonInput extends Input<IFormInput<boolean>> {

  static obsType: TObsType;

  @Prop()
  value: IFormInput<boolean>;

  handleClick() {
    this.emitInput({ ...this.value, value: true });
  }

}

ButtonInput.obsType = 'OBS_PROPERTY_BUTTON';

export default ButtonInput;
</script>