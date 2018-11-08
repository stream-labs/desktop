import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { INumberMetadata } from './index';

@Component({})
export default class NumberInput extends BaseInput<number | string, INumberMetadata> {

  @Prop()
  readonly value: number | string; // the string type is for empty field

  @Prop()
  readonly metadata: INumberMetadata;

  $refs: {
    input: HTMLInputElement;
  };

  emitInput(value: string) {
    let formattedValue = value;
    if (isNaN(Number(formattedValue))) formattedValue = '0';
    if (formattedValue !== value) {
      this.$refs.input.value = formattedValue;
    }
    super.emitInput(Number(formattedValue));
  }

  getValidations() {
    return {
      ...super.getValidations(),
      max_value: this.options.max,
      min_value: this.options.min,
    };
  }
}
