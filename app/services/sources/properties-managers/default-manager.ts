import { PropertiesManager } from './properties-manager';
import { Inject } from 'util/injector';
import { MediaBackupService } from 'services/media-backup';
import * as input from 'components/shared/forms/Input';


interface IDefaultManagerSettings {
  mediaBackup?: {
    serverId?: number;
    originalPath?: string;
  };
}

/**
 * This properties manager simply exposes all properties
 * and does not modify them.
 */
export class DefaultManager extends PropertiesManager {

  @Inject() mediaBackupService: MediaBackupService;

  settings: IDefaultManagerSettings;

  mediaBackupId: string;
  mediaBackupFileSetting: string;
  currentMediaPath: string;

  init() {
    if (!this.settings.mediaBackup) this.settings.mediaBackup = {};
    this.initializeMediaBackup();
  }

  setPropertiesFormData(properties: input.TFormData) {
    super.setPropertiesFormData(properties);
    if (this.obsSource.settings[this.mediaBackupFileSetting] !== this.currentMediaPath) {
      this.uploadNewMediaFile();
    }
  }

  initializeMediaBackup() {
    if (this.obsSource.id === 'ffmpeg_source') {
      this.mediaBackupFileSetting = 'local_file';
    } else if (this.obsSource.id === 'image_source') {
      this.mediaBackupFileSetting = 'file';
    } else {
      return;
    }

    this.getNewMediaBackupId();
    this.currentMediaPath = this.obsSource.settings[this.mediaBackupFileSetting];

    if (this.settings.mediaBackup.serverId && this.settings.mediaBackup.originalPath) {
      this.mediaBackupService.syncFile(
        this.mediaBackupId,
        this.settings.mediaBackup.serverId,
        this.settings.mediaBackup.originalPath
      ).then(file => {
        this.currentMediaPath = file.filePath;
        this.obsSource.update({ [this.mediaBackupFileSetting]: file.filePath });
      });
    } else {
      this.uploadNewMediaFile();
    }
  }

  uploadNewMediaFile() {
    if (!this.mediaBackupFileSetting) return;

    this.getNewMediaBackupId();

    console.log(this.obsSource.settings);

    this.mediaBackupService.createNewFile(
      this.mediaBackupId,
      this.obsSource.settings[this.mediaBackupFileSetting]
    ).then(file => {
      if (file) {
        // debugger;
        this.settings.mediaBackup.serverId = file.serverId;
        this.settings.mediaBackup.originalPath = this.obsSource.settings[this.mediaBackupFileSetting];
      }
    });
  }

  getNewMediaBackupId() {
    this.mediaBackupId = this.mediaBackupService.getLocalFileId();
  }

  isMediaBackupSource() {
    return this.obsSource.id === 'ffmpeg_source';
  }

}
