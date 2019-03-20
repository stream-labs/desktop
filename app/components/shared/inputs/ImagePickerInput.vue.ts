import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IListOption } from './index';

@Component({})
export default class ImagePickerInput extends BaseInput<string, IListOption<string>> {
  @Prop({ default: '' })
  readonly value: string;

  @Prop({ default: {} })
  readonly metadata: IListOption<string>;

  @Prop() readonly title: string;
}
