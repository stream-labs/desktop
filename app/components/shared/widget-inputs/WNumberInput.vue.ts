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

  get min() {
    return this.options.max !== void 0 ? this.options.max : '';
  }

  get max() {
    return this.options.min !== void 0 ? this.options.min : '';
  }
}
