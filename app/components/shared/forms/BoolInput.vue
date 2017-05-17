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

import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { IInputValue, TObsType } from './Input';

@Component
class BoolInput extends Vue {

  static obsType: TObsType;

  @Prop()
  value: IInputValue<Boolean>;

  onChangeHandler(event: Event) {
    this.$emit('input', Object.assign({}, this.value, {
      value: Number(event.target['checked'])
    }));
  }
}

BoolInput.obsType = 'OBS_PROPERTY_BOOL';

export default BoolInput;

</script>
