import { Component } from 'vue-property-decorator';
import Vue from 'vue';
import { Inject } from 'util/injector';
import { MediaBackupService, EGlobalSyncStatus } from 'services/media-backup';

@Component({})
export default class GlobalSyncStatus extends Vue {
  @Inject() mediaBackupService: MediaBackupService;

  get syncIcon() {
    const status = this.mediaBackupService.globalSyncStatus;

    return {
      'fa-cloud': status === EGlobalSyncStatus.Synced,
      'fa-refresh': status === EGlobalSyncStatus.Syncing,
      'fa-spin': status === EGlobalSyncStatus.Syncing
    };
  }

  get syncStatusTooltip() {
    if (this.mediaBackupService.globalSyncStatus === EGlobalSyncStatus.Synced) {
      return 'Cloud Backup: All media and sources are backed up in the cloud';
    }

    return 'Cloud Backup: Your media and sources are being synced with the cloud';
  }
}
