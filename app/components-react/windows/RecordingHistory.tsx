import React from 'react';
import * as remote from '@electron/remote';
import { inject, useModule } from 'slap';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { RecordingModeService } from 'app-services';
import { Tooltip } from 'antd';

class RecordingHistoryModule {
  private RecordingModeService = inject(RecordingModeService);

  get recordings() {
    return this.RecordingModeService.views.sortedRecordings;
  }

  formattedTimestamp(timestamp: string) {
    return this.RecordingModeService.views.formattedTimestamp(timestamp);
  }

  uploadToYoutube(filename: string) {
    return this.RecordingModeService.actions.uploadToYoutube(filename);
  }

  showFile(filename: string) {
    remote.shell.showItemInFolder(filename);
  }
}

export default function RecordingHistory() {
  const { recordings, formattedTimestamp, uploadToYoutube } = useModule(RecordingHistoryModule);

  return (
    <ModalLayout hideFooter scrollable>
      <h2>{$t('Recordings')}</h2>
      <div className="recordingsContainer">
        {recordings.map(recording => (
          <div className="recording">
            <span>{formattedTimestamp(recording.timestamp)}</span>
            <Tooltip title={$t('Show in folder')}>
              <span>{recording.filename}</span>
            </Tooltip>
            <Tooltip title={$t('Upload to YouTube')}>
              <PlatformLogo
                onClick={() => uploadToYoutube(recording.filename)}
                platform="youtube"
              />
            </Tooltip>
          </div>
        ))}
      </div>
    </ModalLayout>
  );
}
