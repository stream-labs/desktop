import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { WindowsService } from '../../services/windows';
import { MediaGalleryService } from '../../services/media-gallery';
import windowMixin from '../mixins/window';
import { $t } from 'services/i18n';

import ModalLayout from '../ModalLayout.vue';

const typeMap = {
  title: {
    image: 'Images',
    audio: 'Sounds'
  },
  noFilesCopy: {
    image: 'You don\'t have any uploaded images!',
    audio: 'You don\'t have any uploaded sounds!'
  },
  noFilesBtn: {
    image: 'Upload An Image',
    audio: 'Upload A Sound'
  }
};

@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class MediaGallery extends Vue {
  @Inject() windowsService: WindowsService;
  @Inject() mediaGalleryService: MediaGalleryService;

  get files() {
    return this.mediaGalleryService.files;
  }
  get type() {
    return this.mediaGalleryService.state.type;
  }
  get category() {
    return this.mediaGalleryService.state.category;
  }

  get title() {
    return $t(typeMap.title[this.type]) || $t('All Files');
  }

  get noFilesCopy() {
    return $t(typeMap.noFilesCopy[this.type]) || $t('You don\'t have any uploaded files!');
  }

  get noFilesBtn() {
    return $t(typeMap.noFilesBtn[this.type]) || $t('Upload A File');
  }

  openFilePicker() {
    document.getElementById('media-gallery-input').click();
  }

  handleTypeFilter(type: string, category: string) {
    this.mediaGalleryService.setTypeFilter(type, category);
  }

  handleUploadDrop(e: DragEvent) {
    const files = e.dataTransfer.files;
    this.mediaGalleryService.upload(files);
  }

  handleUploadClick(e: Event) {
    const files = (<HTMLInputElement>e.target).files;
    this.mediaGalleryService.upload(files);
  }

  handleBrowseGalleryClick() {
    this.mediaGalleryService.setTypeFilter(this.type, 'stock');
  }
}
