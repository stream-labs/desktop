import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IMediaGalleryMetadata } from './index';
import { MediaGalleryInput } from './inputs';

@Component({
  components: { MediaGalleryInput }
})
export default class ImageMediaInput extends BaseInput<string, IMediaGalleryMetadata> {

  @Prop({ default: '' })
  value: string;

  @Prop({ default: {} })
  metadata: IMediaGalleryMetadata;

  get imageMetadata() {
    return { ...this.metadata, imageOnly: true };
  }
}
