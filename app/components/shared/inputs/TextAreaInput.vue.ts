import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IInputMetadata } from './index';

interface IWTextMetadata extends IInputMetadata {
  placeholder: string;
  max: number;
  min: number;
  blockReturn: boolean;
}

@Component({})
export default class TextAreaInput extends BaseInput<string, IWTextMetadata> {
  @Prop()
  readonly value: string;

  @Prop({ default: () => ({}) })
  readonly metadata: IWTextMetadata;

  getValidations() {
    return {
      ...super.getValidations(),
      min: this.options.min,
      max: this.options.max,
    };
  }

  handleInput(value: string) {
    const formattedValue = value.replace(/(\r\n|\r|\n)/g, '');
    this.emitInput(formattedValue);
  }
}
