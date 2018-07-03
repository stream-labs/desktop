import Vue from 'vue';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { WindowsService } from '../../services/windows';
import { MediaGalleryService, IFile } from '../../services/media-gallery';
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
    return this.formatBytes(this.mediaGalleryService.state.totalUsage, 2);
  }
  get maxUsageLabel() {
    return this.formatBytes(this.mediaGalleryService.state.maxUsage, 2);
  }
  get selectedFile() {
    return this.mediaGalleryService.state.selectedFile;
  }

  formatBytes(bytes: number, argPlaces: number) {
    if (!bytes) { return '0KB'; }

    const places = argPlaces || 1;
    const divisor = Math.pow(10, places);
    const base = Math.log(bytes) / Math.log(1024);
    const suffix = ['', 'KB', 'MB', 'GB', 'TB'][Math.floor(base)];
    return (Math.round(Math.pow(1024, base - Math.floor(base)) * divisor) / divisor) + suffix;
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

  openFilePicker() {
    electron.remote.dialog.showOpenDialog(
      electron.remote.getCurrentWindow(),
      { properties: ['openFile', 'multiSelections'] },
      this.mediaGalleryService.upload
    );
  }

  handleFileDrop(e: DragEvent) {
    const mappedFiles = Array.from(e.dataTransfer.files).map((file) => file.path);
    this.mediaGalleryService.upload(mappedFiles);
  }

  handleTypeFilter(type: string, category: string) {
    this.mediaGalleryService.setTypeFilter(type, category);
  }

  handleBrowseGalleryClick() {
    this.mediaGalleryService.setTypeFilter(this.type, 'stock');
  }

  selectFile(file: IFile, select: boolean) {
    this.mediaGalleryService.selectFile(file);

    if (select === true) this.handleSelect();
  }

  handleSelect() {
    this.$emit('selected-file', this.selectedFile);
    this.close();
  }

  handleDelete() {
    if (this.selectedFile) {
      electron.remote.dialog.showMessageBox(
        electron.remote.getCurrentWindow(),
        {
          type: 'warning',
          message: $t('Are you sure you want to delete this file? This action is irreversable.'),
          buttons: [$t('Cancel'), $t('OK')]
        },
        ok => {
          if (!ok) return;
          this.mediaGalleryService.deleteSelectedFile();
        }
      );
    }
  }

  handleDownload() {
    electron.remote.dialog.showSaveDialog(
      electron.remote.getCurrentWindow(),
      { defaultPath: this.selectedFile.filename },
      this.mediaGalleryService.downloadSelectedFile
    );
  }

  handleCopySuccess() {
    return;
  }

  handleCopyError() {
    return;
  }

  close() {
    return;
  }

  handleClose() {
    return;
  }
}
