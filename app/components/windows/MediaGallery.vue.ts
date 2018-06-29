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

const formatBytes = (bytes: number, argPlaces: number) => {
  if (!bytes) { return '0KB'; }

  const places = argPlaces || 1;

  const divisor = Math.pow(10, places);

  const base = Math.log(bytes) / Math.log(1024);
  const suffix = ['', 'KB', 'MB', 'GB', 'TB'][Math.floor(base)];
  return (Math.round(Math.pow(1024, base - Math.floor(base)) * divisor) / divisor) + suffix;
};

@Component({
  components: { ModalLayout },
  mixins: [windowMixin]
})
export default class MediaGallery extends Vue {
  @Inject() windowsService: WindowsService;
  @Inject() mediaGalleryService: MediaGalleryService;

  dragOver = false;

  get files() {
    return this.mediaGalleryService.files;
  }
  get type() {
    return this.mediaGalleryService.state.type;
  }
  get category() {
    return this.mediaGalleryService.state.category;
  }
  get busy() {
    return this.mediaGalleryService.state.busy;
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

  get usagePct() {
    return this.mediaGalleryService.state.totalUsage / this.mediaGalleryService.state.maxUsage;
  }
  get totalUsageLabel() {
    return formatBytes(this.mediaGalleryService.state.totalUsage, 2);
  }
  get maxUsageLabel() {
    return formatBytes(this.mediaGalleryService.state.maxUsage, 2);
  }
  get selectedFile() {
    return this.mediaGalleryService.state.selectedFile;
  }

  onDragOver() {
    this.dragOver = true;
  }

  onDragEnter() {
    this.dragOver = true;
  }

  onDragLeave() {
    this.dragOver = false;
  }

  handleFileDrop(e: DragEvent) {
    this.dragOver = false;

    const files = e.dataTransfer.files;
    this.mediaGalleryService.upload(files);
  }

  openFilePicker() {
    document.getElementById('media-gallery-input').click();
  }

  handleTypeFilter(type: string, category: string) {
    this.mediaGalleryService.setTypeFilter(type, category);
  }

  handleUploadClick(e: Event) {
    const files = (<HTMLInputElement>e.target).files;
    this.mediaGalleryService.upload(files);
  }

  handleBrowseGalleryClick() {
    this.mediaGalleryService.setTypeFilter(this.type, 'stock');
  }

  handleSelect() {
    return;
  }

  handleClose() {
    return;
  }
}
