import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';
import { ISourceApi } from 'services/sources';
import { MediaBackupService, EMediaFileStatus } from 'services/media-backup';
import { Inject } from 'util/injector';

interface IStatusDetails {
  iconClasses: Dictionary<boolean>;
  text: string;
}

@Component({})
export default class DefaultManagerProperties extends Vue {
  @Prop() source: ISourceApi;

  @Inject() mediaBackupService: MediaBackupService;

  mediaBackupId = '';

  created() {
    const managerSettings = this.source.getPropertiesManagerSettings();

    if (managerSettings.mediaBackup) {
      this.mediaBackupId = managerSettings.mediaBackup.localId;
    }
  }

  get mediaFile() {
    return this.mediaBackupService.state.files.find(file => {
      return file.id === this.mediaBackupId;
    });
  }

  get statusDetails(): IStatusDetails {
    if (this.mediaFile.status === EMediaFileStatus.Synced) {
      return {
        iconClasses: {
          'fa-check': true
        },
        text: 'Backed Up'
      };
    }
    if (this.mediaFile.status === EMediaFileStatus.Uploading) {
      return {
        iconClasses: {
          'fa-refresh': true,
          'fa-spin': true
        },
        text: 'Uploading'
      };
    }

    return {
      iconClasses: {},
      text: 'asdf'
    };
  }
}
