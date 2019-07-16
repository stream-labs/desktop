import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IInputMetadata } from './index';

interface IWTextMetadata extends IInputMetadata {
  placeholder: string;
}

@Component({
})
export default class TextAreaInput extends BaseInput<string, IWTextMetadata> {

  @Prop()
  value: string;

  @Prop({ default: () => ({}) })
  metadata: IWTextMetadata;


}
