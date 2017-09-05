<template>
<div class="input-container">
  <div class="input-label">
    <label>{{ value.description }}</label>
  </div>
  <div class="input-wrapper">
    <input
      :type="textVisible ? 'text' : 'password'"
      :value="value.value"
      :disabled="value.enabled == false"
      @change="onInputHandler"
    />
    <button
      class="button button--default button--input"
      v-if="value.masked"
      @click="toggleVisible">
      {{ textVisible ? 'Hide' : 'Show' }}
    </button>
  </div>
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { IFormInput, TObsType, Input } from './Input';

@Component
class TextInput extends Input<IFormInput<string>> {

  static obsType: TObsType[];

  @Prop()
  value: IFormInput<string>;

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
.input-wrapper {
  display: flex;
}

.button--input {
  flex: 0 0 auto;
  width: 80px;
  margin-left: 12px;
}
</style>
