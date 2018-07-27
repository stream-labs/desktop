import { Component, Prop } from 'vue-property-decorator';
import { IWInputMetadata, WInput } from './WInput';

interface IWTextMetadata extends IWInputMetadata {
  placeholder: string;
  validate: string;
}

@Component({})
export default class WTextAreaInput extends WInput<string, IWTextMetadata> {
  @Prop() value: string;

  @Prop({ default: () => ({}) })
  metadata: IWTextMetadata;
}
