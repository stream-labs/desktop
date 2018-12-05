import { shell } from 'electron';
import Component from 'vue-class-component';
import { Inject } from 'util/injector';
import { Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IMediaGalleryMetadata } from './index';
import { MediaGalleryService } from 'services/media-gallery';
import { TextInput } from './inputs';

@Component({
  components: { TextInput }
})
export default class SoundInput extends BaseInput<string, IMediaGalleryMetadata>{
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
    const selectedFile = await this.mediaGalleryService.pickFile({ filter: 'audio' });
    this.emitInput(selectedFile.href);
  }

  clearSound() {
    this.emitInput('');
  }

  previewSound() {
    if (this.value) {
      const audio = new Audio(this.value);
      audio.play();
    }
  }

  toggleUrlUpload() {
    this.showUrlUpload = !this.showUrlUpload;
  }

  uploadUrl() {
    this.emitInput(this.url);
    this.toggleUrlUpload();
  }
}
