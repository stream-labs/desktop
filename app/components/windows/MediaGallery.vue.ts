import Vue from 'vue';
import electron, { clipboard } from 'electron';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { WindowsService } from '../../services/windows';
import { MediaGalleryService, IMediaGalleryFile, IMediaGalleryInfo } from 'services/media-gallery';
import { $t } from 'services/i18n';
import ModalLayout from '../ModalLayout.vue';

const getTypeMap = () => ({
  title: {
    image: $t('Images'),
    audio: $t('Sounds'),
  },
  noFilesCopy: {
    image: $t("You don't have any uploaded images!"),
    audio: $t("You don't have any uploaded sounds!"),
  },
  noFilesBtn: {
    image: $t('Upload An Image'),
    audio: $t('Upload A Sound'),
  },
});

interface IToast {
  el: HTMLElement;
  text: Function;
  goAway: Function;
}

@Component({
  components: { ModalLayout },
})
export default class MediaGallery extends Vue {
  @Inject() windowsService: WindowsService;
  @Inject() mediaGalleryService: MediaGalleryService;

  dragOver = false;
  selectedFile: IMediaGalleryFile = null;
  type: string = null;
  category: string = null;
  galleryInfo: IMediaGalleryInfo = null;
  busy: IToast = null;

  private typeMap = getTypeMap();

  async mounted() {
    this.galleryInfo = await this.mediaGalleryService.fetchGalleryInfo();
  }

  get promiseId() {
    return this.windowsService.state.child.queryParams.promiseId;
  }

  get filter() {
    return this.windowsService.state.child.queryParams.filter;
  }

  get files() {
    if (!this.galleryInfo) return [];

    return this.galleryInfo.files.filter(file => {
      if (this.category !== 'stock' && file.isStock) return false;
      if (this.type && file.type !== this.type) return false;
      return true;
    });
  }

  get title() {
    return this.typeMap.title[this.type] || $t('All Files');
  }

  get noFilesCopy() {
    return this.typeMap.noFilesCopy[this.type] || $t("You don't have any uploaded files!");
  }

  get noFilesBtn() {
    return this.typeMap.noFilesBtn[this.type] || $t('Upload A File');
  }

  get totalUsage() {
    return this.galleryInfo ? this.galleryInfo.totalUsage : 0;
  }

  get maxUsage() {
    return this.galleryInfo ? this.galleryInfo.maxUsage : 0;
  }

  get usagePct() {
    return this.galleryInfo ? this.totalUsage / this.maxUsage : 0;
  }

  get totalUsageLabel() {
    return this.formatBytes(this.totalUsage, 2);
  }

  get maxUsageLabel() {
    return this.formatBytes(this.maxUsage, 2);
  }

  formatBytes(bytes: number, argPlaces: number) {
    if (!bytes) {
      return '0KB';
    }

    const places = argPlaces || 1;
    const divisor = Math.pow(10, places);
    const base = Math.log(bytes) / Math.log(1024);
    const suffix = ['', 'KB', 'MB', 'GB', 'TB'][Math.floor(base)];
    return Math.round(Math.pow(1024, base - Math.floor(base)) * divisor) / divisor + suffix;
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
      this.upload,
    );
  }

  handleFileDrop(e: DragEvent) {
    const mappedFiles = Array.from(e.dataTransfer.files).map(file => file.path);
    this.upload(mappedFiles);
  }

  handleTypeFilter(type: string, category: string) {
    if (type !== this.type || category !== this.category) {
      this.type = type;
      this.category = category;
    }
  }

  handleBrowseGalleryClick() {
    this.category = 'stock';
  }

  selectFile(file: IMediaGalleryFile, select: boolean) {
    if (this.filter && file.type !== this.filter) {
      return this.$toasted.show($t('Not a supported file type'), {
        duration: 1000,
        position: 'top-right',
        className: 'toast-alert',
      });
    }
    this.selectedFile = file;

    if (file.type === 'audio') {
      const audio = new Audio(file.href);
      audio.play();
    }

    if (select === true) this.handleSelect();
  }

  handleSelect() {
    this.mediaGalleryService.resolveFileSelect(this.promiseId, this.selectedFile);
    this.windowsService.closeChildWindow();
  }

  async handleDelete() {
    if (this.selectedFile) {
      electron.remote.dialog.showMessageBox(
        electron.remote.getCurrentWindow(),
        {
          type: 'warning',
          message: $t('Are you sure you want to delete this file? This action is irreversable.'),
          buttons: [$t('Cancel'), $t('OK')],
        },
        async ok => {
          if (!ok || !this.selectedFile) return;
          this.galleryInfo = await this.mediaGalleryService.deleteFile(this.selectedFile);
          this.selectedFile = null;
        },
      );
    }
  }

  async handleDownload() {
    electron.remote.dialog.showSaveDialog(
      electron.remote.getCurrentWindow(),
      { defaultPath: this.selectedFile.fileName },
      async filename => {
        if (!this.selectedFile) return;
        this.setBusy($t('Downloading...'));
        await this.mediaGalleryService.downloadFile(filename, this.selectedFile);
        this.setNotBusy();
      },
    );
  }

  async upload(filepaths: string[]) {
    this.setBusy($t('Uploading...'));
    this.galleryInfo = await this.mediaGalleryService.upload(filepaths);
    this.setNotBusy();
  }

  private setBusy(text: string) {
    this.busy = this.$toasted.show(text, {
      position: 'top-center',
      className: 'toast-busy',
    });
  }

  private setNotBusy() {
    this.busy.goAway();
    this.busy = null;
  }

  async handleCopy(href: string) {
    try {
      await clipboard.writeText(href);
      this.$toasted.show($t('URL Copied'), {
        duration: 1000,
        position: 'top-right',
        className: 'toast-success',
      });
    } catch (e) {
      this.$toasted.show($t('Failed to copy URL'), {
        duration: 1000,
        position: 'top-right',
        className: 'toast-alert',
      });
    }
  }
}
