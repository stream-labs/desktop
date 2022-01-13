import React, { useEffect, useState } from 'react';
import electron, { clipboard } from 'electron';
import * as remote from '@electron/remote';
import { IMediaGalleryFile, IMediaGalleryInfo } from 'services/media-gallery';
import { $t } from 'services/i18n';
import ModalLayout from 'components-react/shared/ModalLayout';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useSubscription } from 'components-react/hooks/useSubscription';

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

function formatBytes(bytes: number, argPlaces: number = 1) {
  if (!bytes) {
    return '0KB';
  }
  const divisor = Math.pow(10, argPlaces);
  const base = Math.log(bytes) / Math.log(1024);
  const suffix = ['', 'KB', 'MB', 'GB', 'TB'][Math.floor(base)];
  return Math.round(Math.pow(1024, base - Math.floor(base)) * divisor) / divisor + suffix;
}

interface IToast {
  el: HTMLElement;
  text: Function;
  goAway: Function;
}

export default function MediaGallery() {
  const {
    WindowsService,
    MediaGalleryService,
    UserService,
    MagicLinkService,
    WebsocketService,
  } = Services;

  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<IMediaGalleryFile | null>(null);
  const [type, setType] = useState<'image' | 'audio' | null>(null);
  const [category, setCategory] = useState<'stock' | 'uploads' | null>(null);
  const [galleryInfo, setGalleryInfo] = useState<IMediaGalleryInfo | null>(null);
  const [busy, setBusy] = useState<IToast | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const typeMap = getTypeMap();

  useEffect(() => {
    const filter = WindowsService.state.child.queryParams?.filter;
    if (filter) setType(filter);
    fetchGalleryInfo();

    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
    };
  }, []);

  useSubscription(WebsocketService.socketEvent, ev => {
    if (ev.type !== 'streamlabs_prime_subscribe') return;
    fetchGalleryInfo();
  });

  async function fetchGalleryInfo() {
    setGalleryInfo(await MediaGalleryService.fetchGalleryInfo());
  }

  async function openFilePicker() {
    const choices = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile', 'multiSelections'],
    });
    if (choices && choices.filePaths) {
      upload(choices.filePaths);
    }
  }

  async function upload(filepaths: string[]) {
    if (!filepaths || !filepaths.length) return;
    setToast($t('Uploading...'));
    setGalleryInfo(await MediaGalleryService.upload(filepaths));
    clearToast();
  }

  function setToast(text: string) {
    // this.busy = this.$toasted.show(text, {
    //   position: 'top-center',
    //   className: 'toast-busy',
    // });
  }

  function clearToast() {
    // if (!this.busy) return;
    // this.busy.goAway();
    // this.busy = null;
  }

  function upgradeToPrime() {
    MagicLinkService.linkToPrime('slobs-media-gallery');
    setToast;
    // this.$toasted.show($t('You must have Streamlabs Prime to use this media'), {
    //   duration: 5000,
    //   position: 'top-right',
    //   className: 'toast-prime',
    // });
  }

  // get promiseId() {
  //   return this.windowsService.state.child.queryParams.promiseId;
  // }

  // get files() {
  //   if (!this.galleryInfo) return [];
  //   return this.galleryInfo.files.filter(file => {
  //     if (this.category !== 'stock' && file.isStock !== false) return false;
  //     if (this.category === 'stock' && file.isStock === false) return false;
  //     return !(this.type && file.type !== this.type);
  //   });
  // }
  // get title() {
  //   return this.typeMap.title[this.type] || $t('All Files');
  // }
  // get noFilesCopy() {
  //   return this.typeMap.noFilesCopy[this.type] || $t("You don't have any uploaded files!");
  // }
  // get noFilesBtn() {
  //   return this.typeMap.noFilesBtn[this.type] || $t('Upload A File');
  // }
  // get totalUsage() {
  //   return this.galleryInfo ? this.galleryInfo.totalUsage : 0;
  // }
  // get maxUsage() {
  //   return this.galleryInfo ? this.galleryInfo.maxUsage : 0;
  // }
  // get usagePct() {
  //   return this.galleryInfo ? this.totalUsage / this.maxUsage : 0;
  // }
  // get totalUsageLabel() {
  //   return this.formatBytes(this.totalUsage, 2);
  // }
  // get maxUsageLabel() {
  //   return this.formatBytes(this.maxUsage, 2);
  // }
  // onDragOver() {
  //   this.dragOver = true;
  // }
  // onDragEnter() {
  //   this.dragOver = true;
  // }
  // onDragLeave() {
  //   this.dragOver = false;
  // }

  // handleFileDrop(e: DragEvent) {
  //   const mappedFiles = Array.from(e.dataTransfer.files).map(file => file.path);
  //   this.upload(mappedFiles);
  //   this.dragOver = false;
  // }
  // handleTypeFilter(type: 'audio' | 'image', category: 'stock' | 'uploads') {
  //   if (type !== this.type || category !== this.category) {
  //     this.type = type;
  //     this.category = category;
  //   }
  // }
  // handleBrowseGalleryClick() {
  //   this.category = 'stock';
  // }
  // selectFile(file: IMediaGalleryFile, shouldSelect: boolean = false) {
  //   if (this.filter && file.type !== this.filter) {
  //     return this.$toasted.show($t('Not a supported file type'), {
  //       duration: 1000,
  //       position: 'top-right',
  //       className: 'toast-alert',
  //     });
  //   }
  //   this.selectedFile = file;
  //   if (file.type === 'audio' && !shouldSelect) {
  //     if (this.audio) this.audio.pause();
  //     this.audio = new Audio(file.href);
  //     this.audio.play();
  //   }
  //   if (shouldSelect) this.handleSelect();
  // }
  // handleSelect() {
  //   if (!this.selectedFile) return this.windowsService.actions.closeChildWindow();
  //   if (this.selectedFile.prime && !this.userService.views.isPrime) {
  //     this.upgradeToPrime();
  //     return;
  //   }
  //   this.mediaGalleryService.resolveFileSelect(this.promiseId, this.selectedFile);
  //   this.windowsService.actions.closeChildWindow();
  // }
  // async handleDelete() {
  //   if (this.selectedFile) {
  //     remote.dialog
  //       .showMessageBox(remote.getCurrentWindow(), {
  //         title: 'Streamlabs Desktop',
  //         type: 'warning',
  //         message: $t('Are you sure you want to delete this file? This action is irreversable.'),
  //         buttons: [$t('Cancel'), $t('OK')],
  //       })
  //       .then(async ({ response }) => {
  //         if (!response || !this.selectedFile) return;
  //         this.galleryInfo = await this.mediaGalleryService.deleteFile(this.selectedFile);
  //         this.selectedFile = null;
  //       });
  //   }
  // }
  // async handleDownload() {
  //   const { filePath } = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
  //     defaultPath: this.selectedFile.filename,
  //   });
  //   if (!this.selectedFile) return;
  //   this.setBusy($t('Downloading...'));
  //   await this.mediaGalleryService.downloadFile(filePath, this.selectedFile);
  //   this.setNotBusy();
  // }

  // async handleCopy(href: string) {
  //   try {
  //     await clipboard.writeText(href);
  //     this.$toasted.show($t('URL Copied'), {
  //       duration: 1000,
  //       position: 'top-right',
  //       className: 'toast-success',
  //     });
  //   } catch (e: unknown) {
  //     this.$toasted.show($t('Failed to copy URL'), {
  //       duration: 1000,
  //       position: 'top-right',
  //       className: 'toast-alert',
  //     });
  //   }
  // }
}
