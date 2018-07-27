import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { INumberMetadata } from './index';
import { String } from '../../../../node_modules/aws-sdk/clients/ssm';

@Component({})
export default class NumberInput extends BaseInput<number | string, INumberMetadata> {

  @Prop()
  value: number | string; // the string type is for empty field

  @Prop()
  metadata: INumberMetadata;

  emitInput(eventData: String) {
    if (!isNaN(parseFloat(eventData))) {
      // if is a string of valid number
      // convert to number
      super.emitInput(parseFloat(eventData));
      return;
    }
    super.emitInput(eventData);
  }

  getValidations() {
    return {
      ...super.getValidations(),
      max_value: this.options.max,
      min_value: this.options.min,
    };
  }
}
