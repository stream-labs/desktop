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

  getValidations() {
    return {
      ...super.getValidations(),
      date_format:  this.options.dateFormat,
      max: this.options.max
    };
  }

}
