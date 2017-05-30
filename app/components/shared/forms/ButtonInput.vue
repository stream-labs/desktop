<template>
  <div>
    <button
      class="button button--action ButtonProperty-button"
      @click="handleClick">
      {{ value.description }}
    </button>
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

<style lang="less" scoped>
  .ButtonProperty-button {
    margin: 15px 0;
  }
</style>