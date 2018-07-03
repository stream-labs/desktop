import { Component, Prop } from 'vue-property-decorator';
import { WInput } from './WInput';

interface IWTextMetadata {
  placeholder: string;
}

@Component({
})
export default class WTextAreaInput extends WInput<string, IWTextMetadata> {

  @Prop()
  value: string;

  @Prop({ default: () => ({}) })
  metadata: IWTextMetadata;


}
