import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IListMetadata } from './index';

@Component({})
export default class ImagePickerInput extends BaseInput<string, IListMetadata<string>> {
  @Prop({ default: '' })
  readonly value: string;

  @Prop({ default: {} })
  readonly metadata: IListMetadata<string>;

  @Prop() readonly title: string;
}
