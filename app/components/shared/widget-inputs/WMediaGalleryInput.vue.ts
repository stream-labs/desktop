import { shell } from 'electron';
import Component from 'vue-class-component';
import { Inject } from 'util/injector';
import { Prop } from 'vue-property-decorator';
import { WInput, IWInputMetadata } from './WInput';
import { MediaGalleryService } from 'services/media-gallery';
import { WTextInput } from './index';
import WFormGroup from './WFormGroup.vue';

interface IWMediaGalleryMetadata extends IWInputMetadata {
  fileName: string;
  clearImage: string;
}
@Component({
  components: { WTextInput, WFormGroup }
})
export default class WMediaGallery extends WInput<string, IWMediaGalleryMetadata>{
  @Inject() mediaGalleryService: MediaGalleryService;
  @Prop() value: string;
  @Prop() metadata: IWMediaGalleryMetadata;

  fileName: string = this.metadata.fileName;
  url: string = '';
  showUrlUpload = false;

  async updateValue() {
    const selectedFile = await this.mediaGalleryService.pickFile();
    this.fileName = selectedFile.fileName;
    this.emitInput(selectedFile.href);
  }

  clearImage() {
    this.emitInput(this.metadata.clearImage);
  }

  previewImage() {
    shell.openExternal(this.value);
  }

  toggleUrlUpload() {
    this.showUrlUpload = !this.showUrlUpload;
  }

  uploadUrl() {
    this.emitInput(this.url);
    this.toggleUrlUpload();
  }
}
