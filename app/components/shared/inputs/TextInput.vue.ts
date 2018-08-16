import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { ITextMetadata } from './index';

@Component({})
export default class TextInput extends BaseInput<string, ITextMetadata> {

  @Prop()
  value: string;

  @Prop({ default: {} })
  metadata: ITextMetadata;

  getValidations() {
    return {
      ...super.getValidations(),
      date_format:  this.options.dateFormat,
      max: this.options.max,
      alpha: this.options.alpha
    };
  }
}
