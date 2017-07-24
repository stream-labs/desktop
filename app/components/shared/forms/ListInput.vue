<template>
<div class="input-container select" :class="{disabled: value.enabled === false}">
  <div class="input-label">
    <label>{{ value.description }}</label>
  </div>
  <div class="input-wrapper">
    <multiselect
      :value="currentValue"
      :disabled="value.enabled === false"
      :options="value.options"
      track-by="value"
      :close-on-select="true"
      :allow-empty="false"
      label="description"
      @input="onInputHandler">
      <template slot="option" scope="props">
        <span>
          {{ props.option.description }}
        </span>
      </template>
    </multiselect>
  </div>
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { TObsType, IListInputValue, IListOption, Input } from './Input';
import { Multiselect } from 'vue-multiselect';

@Component({
  components: { Multiselect }
})

class ListInput extends Input<IListInputValue> {

  static obsType: TObsType;

  @Prop()
  value: IListInputValue;

  onInputHandler(option: IListOption<string>) {
    this.emitInput({ ...this.value, value: option.value });
  }

  get currentValue() {
    const option = this.value.options.find((opt: IListOption<string>) => {
      return this.value.value === opt.value;
    });

    return option || this.value.options[0];
  }

}

ListInput.obsType = 'OBS_PROPERTY_LIST';

export default ListInput;
</script>
