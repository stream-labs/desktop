import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IListOption } from './index';

@Component({})
export default class ImagePickerInput extends BaseInput<string, IListOption<string>> {

  @Prop({ default: '' })
  value: string;

  @Prop({ default: {} })
  metadata: IListOption<string>;
}
