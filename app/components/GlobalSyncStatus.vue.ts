import { Component } from 'vue-property-decorator';
import Vue from 'vue';
import { Inject } from 'util/injector';
import { MediaBackupService, EGlobalSyncStatus } from 'services/media-backup';
import { $t } from 'services/i18n';

@Component({})
export default class GlobalSyncStatus extends Vue {
  @Inject() mediaBackupService: MediaBackupService;

  get syncIcon() {
    const status = this.mediaBackupService.globalSyncStatus;

    return {
      'icon-cloud-backup-2': status === EGlobalSyncStatus.Synced,
      'fa-refresh': status === EGlobalSyncStatus.Syncing,
      'fa-spin': status === EGlobalSyncStatus.Syncing
    };
  }

  get syncStatusTooltip() {
    if (this.mediaBackupService.globalSyncStatus === EGlobalSyncStatus.Synced) {
      return $t('Cloud Backup: All media and sources are backed up in the cloud');
    }

    return $t('Cloud Backup: Your media and sources are being synced with the cloud');
  }
}
