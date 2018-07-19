import { Component, Prop } from 'vue-property-decorator';
import { WInput, IWInputMetadata } from './WInput';
import { IListInput } from '../forms/Input';

@Component({})
export default class WImagePicker extends WInput<string, IListInput<string>> {

  @Prop({ default: '' })
  value: string;

  @Prop({ default: {} })
  metadata: IListInput<string>;
}
