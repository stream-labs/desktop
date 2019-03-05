import { PropertiesManager } from './properties-manager';
import { Inject } from 'util/injector';
import { MediaBackupService } from 'services/media-backup';
import * as input from 'components/obs/inputs/ObsInput';
import * as fi from 'node-fontinfo';
import { FontLibraryService } from 'services/font-library';
import { EFontStyle } from 'obs-studio-node';
import fs from 'fs';
import path from 'path';
import { UserService } from 'services/user';
import { CustomizationService } from 'services/customization';

export interface IDefaultManagerSettings {
  mediaBackup?: {
    localId?: string;
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
  @Inject() fontLibraryService: FontLibraryService;
  @Inject() userService: UserService;
  @Inject() customizationService: CustomizationService;

  settings: IDefaultManagerSettings;

  mediaBackupFileSetting: string;
  currentMediaPath: string;

  init() {
    if (!this.settings.mediaBackup) this.settings.mediaBackup = {};
    this.initializeMediaBackup();
    this.downloadGoogleFont();
  }

  setPropertiesFormData(properties: input.TObsFormData) {
    super.setPropertiesFormData(properties);
    if (this.obsSource.settings[this.mediaBackupFileSetting] !== this.currentMediaPath) {
      this.currentMediaPath = this.obsSource.settings[this.mediaBackupFileSetting];
      this.uploadNewMediaFile();
    }
  }

  initializeMediaBackup() {
    if (this.customizationService.state.mediaBackupOptOut) {
      this.settings.mediaBackup = {};
      return;
    }

    if (!this.userService.isLoggedIn()) return;

    if (this.obsSource.id === 'ffmpeg_source') {
      this.mediaBackupFileSetting = 'local_file';
    } else if (this.obsSource.id === 'image_source') {
      this.mediaBackupFileSetting = 'file';
    } else if (this.obsSource.id === 'obs_stinger_transition') {
      this.mediaBackupFileSetting = 'path';
    } else {
      return;
    }

    this.ensureMediaBackupId();
    this.currentMediaPath = this.obsSource.settings[this.mediaBackupFileSetting];

    if (this.settings.mediaBackup.serverId && this.settings.mediaBackup.originalPath) {
      this.mediaBackupService
        .syncFile(
          this.settings.mediaBackup.localId,
          this.settings.mediaBackup.serverId,
          this.settings.mediaBackup.originalPath,
        )
        .then(file => {
          if (file && !this.destroyed) {
            this.currentMediaPath = file.filePath;
            this.obsSource.update({ [this.mediaBackupFileSetting]: file.filePath });
          }
        });
    } else {
      this.uploadNewMediaFile();
    }
  }

  uploadNewMediaFile() {
    if (!this.mediaBackupFileSetting) return;
    if (!this.obsSource.settings[this.mediaBackupFileSetting]) return;

    this.settings.mediaBackup.serverId = null;
    this.settings.mediaBackup.originalPath = null;

    this.mediaBackupService
      .createNewFile(
        this.settings.mediaBackup.localId,
        this.obsSource.settings[this.mediaBackupFileSetting],
      )
      .then(file => {
        if (file) {
          this.settings.mediaBackup.serverId = file.serverId;
          this.settings.mediaBackup.originalPath = this.obsSource.settings[
            this.mediaBackupFileSetting
          ];
        }
      });
  }

  ensureMediaBackupId() {
    if (this.settings.mediaBackup.localId) return;
    this.settings.mediaBackup.localId = this.mediaBackupService.getLocalFileId();
  }

  isMediaBackupSource() {
    return this.obsSource.id === 'ffmpeg_source';
  }

  async downloadGoogleFont() {
    if (this.obsSource.id !== 'text_gdiplus') return;

    const settings = this.obsSource.settings;
    const newSettings: Dictionary<any> = {};

    if (!settings['custom_font']) return;
    if (fs.existsSync(settings.custom_font)) return;

    const filename = path.parse(settings['custom_font']).base;

    const fontPath = await this.fontLibraryService.downloadFont(filename);

    // Make sure this wasn't destroyed while fetching the font
    if (this.destroyed) return;

    const fontInfo = fi.getFontInfo(fontPath);

    if (!fontInfo) {
      // Fallback to Arial
      newSettings['custom_font'] = null;
      newSettings['font'] = {
        face: 'Arial',
        flags: 0,
      };
      this.obsSource.update(newSettings);
      return;
    }

    newSettings['custom_font'] = fontPath;
    newSettings['font'] = { ...settings['font'] };
    newSettings['font'] = newSettings['font'] || {};
    newSettings['font']['face'] = fontInfo.family_name;
    newSettings['font']['flags'] =
      (fontInfo.italic ? EFontStyle.Italic : 0) | (fontInfo.bold ? EFontStyle.Bold : 0);

    this.obsSource.update(newSettings);
  }
}
