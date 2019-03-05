import { shell } from 'electron';
import Component from 'vue-class-component';
import { Inject } from 'util/injector';
import { Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IMediaGalleryMetadata } from './index';
import { MediaGalleryService } from 'services/media-gallery';
import { TextInput } from './inputs';

@Component({
  components: { TextInput },
})
export default class MediaGalleryInput extends BaseInput<string, IMediaGalleryMetadata> {
  @Inject() mediaGalleryService: MediaGalleryService;
  @Prop() readonly value: string;
  @Prop() readonly metadata: IMediaGalleryMetadata;

  url: string = '';
  showUrlUpload = false;

  get fileName() {
    if (!this.value) return null;
    return decodeURIComponent(this.value.split(/[\\/]/).pop());
  }

  async updateValue() {
    const filter = this.metadata.filter;
    const selectedFile = await this.mediaGalleryService.pickFile({ filter });
    this.emitInput(selectedFile.href);
  }

  clearImage() {
    this.emitInput(this.metadata.clearImage || '');
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
