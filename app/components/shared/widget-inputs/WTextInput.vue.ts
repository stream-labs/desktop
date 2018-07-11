import { Component, Prop } from 'vue-property-decorator';
import { IWInputMetadata, WInput } from './WInput';

interface IWTextMetadata extends IWInputMetadata {
  placeholder: string;
  validate: string;
  maxlength: number;
}

@Component({
})
export default class WText extends WInput<string, IWTextMetadata> {

  @Prop()
  value: string;

  @Prop({ default: {} })
  metadata: IWTextMetadata;


}
