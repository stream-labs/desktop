import { Component, Prop } from 'vue-property-decorator';
import { IWInputMetadata, WInput } from './WInput';

interface IWTextMetadata extends IWInputMetadata {
  placeholder: string;
  validate: string;
  max: number;
  dateFormat: string;
}

@Component({})
export default class WText extends WInput<string, IWTextMetadata> {

  @Prop()
  value: string;

  @Prop({ default: {} })
  metadata: IWTextMetadata;

  get dateFormat(): string {
    return this.options.dateFormat !== void 0 ? this.options.dateFormat : '';
  }

  get max(): number | string {
    return this.options.max !== void 0 ? this.options.max : '';
  }

}
