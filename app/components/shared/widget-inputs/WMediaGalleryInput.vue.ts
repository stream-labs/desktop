import Component from 'vue-class-component';
import { Inject } from 'util/injector';
import { Prop } from 'vue-property-decorator';
import { WInput } from './WInput';
import { MediaGalleryService } from 'services/media-gallery';

@Component({

})
export default class WMediaGallery extends WInput<string, {}>{
  @Inject() mediaGalleryService: MediaGalleryService;

  @Prop()
  value: string;

  async updateValue() {
    const selectedFile = await this.mediaGalleryService.pickFile();
    console.log(selectedFile);
  }
}
