import { Component, Prop } from 'vue-property-decorator';
import { IListMetadata } from '../../shared/inputs';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import ImagePickerInput from '../../shared/inputs/ImagePickerInput.vue';

@Component({
  components: { ImagePickerInput }
})
export default class ImageLayoutInput extends BaseInput<string, IListMetadata<string>> {

  @Prop()
  readonly value: string;

  @Prop()
  readonly metadata: IListMetadata<string>;

  layoutOptions = [
    { description: './media/images/layout-image-side.png', value: 'side' },
    { description: './media/images/layout-image-above.png', value: 'above'}
  ];

  get meta(): IListMetadata<string> {
    return { options: this.layoutOptions, ...this.metadata };
  }
}
