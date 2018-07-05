import { Component, Prop } from 'vue-property-decorator';
import { WInput } from './WInput';

interface IWTextMetadata {
  placeholder: string;
  validate: string;
}

@Component({
})
export default class WText extends WInput<string, IWTextMetadata> {

  @Prop()
  value: string;

  @Prop({ default: {} })
  metadata: IWTextMetadata;


}
