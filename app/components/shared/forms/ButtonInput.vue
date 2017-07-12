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
import { Input, IInputValue, TObsType } from './Input';

@Component
class ButtonInput extends Input<IInputValue<{}>> {

  static obsType: TObsType;

  @Prop()
  value: IInputValue<{}>;

  handleClick() {
    this.emitInput({ ...this.value, value: {} });
  }

}

ButtonInput.obsType = 'OBS_PROPERTY_BUTTON';

export default ButtonInput;
</script>