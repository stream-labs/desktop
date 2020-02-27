import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IImagePickerMetadata } from './index';

@Component({})
export default class ImagePickerInput extends BaseInput<string, IImagePickerMetadata<string>> {
  @Prop({ default: '' })
  readonly value: string;

  @Prop({ default: {} })
  readonly metadata: IImagePickerMetadata<string>;

  @Prop() readonly title: string;
}
