import { Component, Prop } from 'vue-property-decorator';
import { IListMetadata } from '../../shared/inputs';
import { BaseInput } from 'components/shared/inputs/BaseInput';
import ImagePicker from '../../shared/inputs/ImagePicker.vue';

@Component({
  components: { ImagePicker }
})
export default class AnimationInput extends BaseInput<string, IListMetadata<string>> {

  @Prop()
  value: string;

  @Prop()
  metadata: IListMetadata<string>;

  layoutOptions = [
    { description: './media/images/layout-image-side.png', value: 'side' },
    { description: './media/images/layout-image-above.png', value: 'above'}
  ];

  get meta(): IListMetadata<string> {
    return { options: this.layoutOptions, ...this.metadata };
  }
}
