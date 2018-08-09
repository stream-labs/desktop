import { shell } from 'electron';
import Component from 'vue-class-component';
import { Inject } from 'util/injector';
import { Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { IMediaGalleryMetadata } from './index';
import { MediaGalleryService } from 'services/media-gallery';
import { TextInput } from './inputs';
import FormGroup from './FormGroup.vue';
import { $t } from 'services/i18n';

@Component({
  components: { TextInput, FormGroup }
})
export default class SoundInput extends BaseInput<string, IMediaGalleryMetadata>{
  @Inject() mediaGalleryService: MediaGalleryService;
  @Prop() value: string;
  @Prop() metadata: IMediaGalleryMetadata;

  fileName: string = this.metadata.fileName;
  url: string = '';
  showUrlUpload = false;

  async updateValue() {
    const selectedFile = await this.mediaGalleryService.pickFile({ audioOnly: true });
    this.fileName = selectedFile.fileName;
    this.emitInput(selectedFile.href);
  }

  clearSound() {
    this.emitInput('');
  }

  previewSound() {
    if (this.url) {
      const audio = new Audio(this.url);
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
