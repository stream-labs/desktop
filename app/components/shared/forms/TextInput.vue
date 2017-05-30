<template>
<div class="input">
  <label>{{ value.description }}</label>
  <div class="ButtonInput">
    <input
      :type="textVisible ? 'text' : 'password'"
      :value="value.value"
      :disabled="value.enabled == false"
      @change="onInputHandler"
    />
    <button
      class="button button--default"
      v-if="value.masked"
      @click="toggleVisible">
      {{ textVisible ? 'Hide' : 'Show' }}
    </button>
  </div>
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { IInputValue, TObsType, Input } from './Input';


@Component
class TextInput extends Input<IInputValue<string>> {

  static obsType: TObsType[];

  @Prop()
  value: IInputValue<string>;

  textVisible = !this.value.masked;


  toggleVisible() {
    this.textVisible = !this.textVisible;
  }


  onInputHandler(event: Event) {
    this.emitInput({ ...this.value, value: event.target['value'] });
  }

}
TextInput.obsType = ['OBS_PROPERTY_EDIT_TEXT', 'OBS_PROPERTY_TEXT'];
export default TextInput;

</script>

<style lang="less" scoped>
.ButtonInput {
  display: flex;
  flex-direction: row;

  >input {
    flex-grow: 1;
  }

  >button {
    margin-left: 10px;
    width: 80px;
  }
}
</style>
