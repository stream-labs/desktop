import Vue from 'vue';
import electron, { clipboard } from 'electron';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/core/injector';
import { WindowsService } from '../../services/windows';
import { MediaGalleryService, IMediaGalleryFile, IMediaGalleryInfo } from 'services/media-gallery';
import { $t } from 'services/i18n';
import ModalLayout from '../ModalLayout.vue';
import Scrollable from 'components/shared/Scrollable';
import { UserService } from 'services/user';
import { MagicLinkService } from 'services/magic-link';
import { WebsocketService, TSocketEvent } from 'services/websocket';
import { Subscription } from 'rxjs';

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
  components: { ModalLayout, Scrollable },
})
export default class MediaGallery extends Vue {
  @Inject() windowsService: WindowsService;
  @Inject() mediaGalleryService: MediaGalleryService;
  @Inject() userService: UserService;
  @Inject() magicLinkService: MagicLinkService;
  @Inject() websocketService: WebsocketService;

  dragOver = false;
  selectedFile: IMediaGalleryFile = null;
  type: 'image' | 'audio' = null;
  category: 'stock' | 'uploads' = null;
  galleryInfo: IMediaGalleryInfo = null;
  busy: IToast = null;

  private typeMap = getTypeMap();
  private socketConnection: Subscription = null;
  private audio: HTMLAudioElement = null;

  async mounted() {
    this.galleryInfo = await this.mediaGalleryService.fetchGalleryInfo();
    if (this.filter) this.type = this.filter;

    this.socketConnection = this.websocketService.socketEvent.subscribe(ev =>
      this.onSocketEvent(ev),
    );
  }

  destroyed() {
    if (this.socketConnection) this.socketConnection.unsubscribe();
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
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
      if (this.category !== 'stock' && file.isStock !== false) return false;
      if (this.category === 'stock' && file.isStock === false) return false;
      return !(this.type && file.type !== this.type);
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

  async onSocketEvent(e: TSocketEvent) {
    if (e.type !== 'streamlabs_prime_subscribe') return;
    this.galleryInfo = await this.mediaGalleryService.fetchGalleryInfo();
  }

  formatBytes(bytes: number, argPlaces: number = 1) {
    if (!bytes) {
      return '0KB';
    }

    const divisor = Math.pow(10, argPlaces);
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

  async openFilePicker() {
    const choices = await electron.remote.dialog.showOpenDialog(
      electron.remote.getCurrentWindow(),
      { properties: ['openFile', 'multiSelections'] },
    );

    if (choices && choices.filePaths) {
      this.upload(choices.filePaths);
    }
  }

  handleFileDrop(e: DragEvent) {
    const mappedFiles = Array.from(e.dataTransfer.files).map(file => file.path);
    this.upload(mappedFiles);
    this.dragOver = false;
  }

  handleTypeFilter(type: 'audio' | 'image', category: 'stock' | 'uploads') {
    if (type !== this.type || category !== this.category) {
      this.type = type;
      this.category = category;
    }
  }

  handleBrowseGalleryClick() {
    this.category = 'stock';
  }

  selectFile(file: IMediaGalleryFile, shouldSelect: boolean = false) {
    if (this.filter && file.type !== this.filter) {
      return this.$toasted.show($t('Not a supported file type'), {
        duration: 1000,
        position: 'top-right',
        className: 'toast-alert',
      });
    }
    this.selectedFile = file;

    if (file.type === 'audio' && !shouldSelect) {
      if (this.audio) this.audio.pause();
      this.audio = new Audio(file.href);
      this.audio.play();
    }

    if (shouldSelect) this.handleSelect();
  }

  upgradeToPrime() {
    this.magicLinkService.linkToPrime('slobs-media-gallery');
    this.$toasted.show($t('You must have Streamlabs Prime to use this media'), {
      duration: 5000,
      position: 'top-right',
      className: 'toast-prime',
    });
  }

  handleSelect() {
    if (!this.selectedFile) return this.windowsService.actions.closeChildWindow();
    if (this.selectedFile.prime && !this.userService.views.isPrime) {
      this.upgradeToPrime();
      return;
    }
    this.mediaGalleryService.resolveFileSelect(this.promiseId, this.selectedFile);
    this.windowsService.actions.closeChildWindow();
  }

  async handleDelete() {
    if (this.selectedFile) {
      electron.remote.dialog
        .showMessageBox(electron.remote.getCurrentWindow(), {
          title: 'Streamlabs Desktop',
          type: 'warning',
          message: $t('Are you sure you want to delete this file? This action is irreversable.'),
          buttons: [$t('Cancel'), $t('OK')],
        })
        .then(async ({ response }) => {
          if (!response || !this.selectedFile) return;
          this.galleryInfo = await this.mediaGalleryService.deleteFile(this.selectedFile);
          this.selectedFile = null;
        });
    }
  }

  async handleDownload() {
    const { filePath } = await electron.remote.dialog.showSaveDialog(
      electron.remote.getCurrentWindow(),
      {
        defaultPath: this.selectedFile.filename,
      },
    );

    if (!this.selectedFile) return;
    this.setBusy($t('Downloading...'));
    await this.mediaGalleryService.downloadFile(filePath, this.selectedFile);
    this.setNotBusy();
  }

  async upload(filepaths: string[]) {
    if (!filepaths || !filepaths.length) return;
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
    if (!this.busy) return;
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
    } catch (e: unknown) {
      this.$toasted.show($t('Failed to copy URL'), {
        duration: 1000,
        position: 'top-right',
        className: 'toast-alert',
      });
    }
  }
}
