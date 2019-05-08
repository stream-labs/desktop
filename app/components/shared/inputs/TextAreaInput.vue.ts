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

  @Prop()
  readonly title: string;

  getValidations() {
    return {
      ...super.getValidations(),
      min: this.options.min,
      max: this.options.max,
    };
  }

  handleInput(event: { target: HTMLInputElement }) {
    const val = this.options.blockReturn
      ? event.target.value.replace(/(\r\n|\r|\n)/g, '')
      : event.target.value;
    this.emitInput(val);
  }

  handleEnter(ev: Event) {
    if (this.options.blockReturn) ev.preventDefault();
  }
}
