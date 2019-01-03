import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { ITextMetadata } from './index';

@Component({})
export default class TextInput extends BaseInput<string, ITextMetadata> {
  @Prop()
  readonly value: string;

  @Prop({ default: () => ({}) })
  readonly metadata: ITextMetadata;

  getValidations() {
    return {
      ...super.getValidations(),
      date_format: this.options.dateFormat,
      max: this.options.max,
      min: this.options.min,
      alpha_num: this.options.alphaNum,
    };
  }
}
