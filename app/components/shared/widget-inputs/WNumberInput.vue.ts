import { Component, Prop } from 'vue-property-decorator';
import { IWInputMetadata, WInput } from './WInput';

interface IWNumberMetadata extends IWInputMetadata {
  min?: number;
  max?: number;
  placeholder?: string;
}

@Component({
})
export default class WNumberInput extends WInput<number|string, IWNumberMetadata> {

  @Prop()
  value: number | string; // the string type is for empty field

  @Prop({ default: {} })
  metadata: IWNumberMetadata;

  getValidations() {
    return {
      ...super.getValidations(),
      max_value: this.options.max,
      min_value: this.options.min,
    };
  }
}
