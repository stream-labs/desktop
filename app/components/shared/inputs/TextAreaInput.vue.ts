import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { ITextAreaMetadata } from './index';

@Component({})
export default class TextAreaInput extends BaseInput<string, ITextAreaMetadata> {
  @Prop()
  readonly value: string;

  @Prop({ default: () => ({}) })
  readonly metadata: ITextAreaMetadata;

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
