import { Component, Prop } from 'vue-property-decorator';
import { IWNumberMetadata, WInput } from './WInput';

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
