import React from 'react';
import * as remote from '@electron/remote';
import { Tooltip } from 'antd';
import { inject, useModule } from 'slap';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import { RecordingModeService, UserService } from 'app-services';
import styles from './RecordingHistory.m.less';
import AutoProgressBar from 'components-react/shared/AutoProgressBar';

class RecordingHistoryModule {
  private RecordingModeService = inject(RecordingModeService);
  private UserService = inject(UserService);

  get recordings() {
    return this.RecordingModeService.views.sortedRecordings;
  }

  get hasYoutube() {
    return this.UserService.views.linkedPlatforms.includes('youtube');
  }

  get uploadInfo() {
    return this.RecordingModeService.state.uploadInfo;
  }

  formattedTimestamp(timestamp: string) {
    return this.RecordingModeService.views.formattedTimestamp(timestamp);
  }

  uploadToYoutube(filename: string) {
    this.RecordingModeService.actions.uploadToYoutube(filename);
  }

  showFile(filename: string) {
    remote.shell.showItemInFolder(filename);
  }

  cancelUpload() {
    this.RecordingModeService.actions.cancelUpload();
  }
}

export default function RecordingHistory() {
  const { recordings, hasYoutube, formattedTimestamp, uploadToYoutube, showFile } = useModule(
    RecordingHistoryModule,
  );

  return (
    <ModalLayout hideFooter scrollable>
      <h2>{$t('Recordings')}</h2>
      <div className={styles.recordingsContainer}>
        {recordings.map(recording => (
          <div className={styles.recording} key={recording.timestamp}>
            <span>{formattedTimestamp(recording.timestamp)}</span>
            <Tooltip title={$t('Show in folder')}>
              <span onClick={() => showFile(recording.filename)} className={styles.filename}>
                {recording.filename}
              </span>
            </Tooltip>
            {hasYoutube && (
              <Tooltip title={$t('Upload to YouTube')} placement="left">
                <div onClick={() => uploadToYoutube(recording.filename)}>
                  <PlatformLogo platform="youtube" />
                </div>
              </Tooltip>
            )}
          </div>
        ))}
      </div>
      <ExportModal />
    </ModalLayout>
  );
}

function ExportModal() {
  const { uploadInfo, cancelUpload } = useModule(RecordingHistoryModule);
  const { uploadedBytes, totalBytes } = uploadInfo;

  if (!uploadedBytes || !totalBytes) return <></>;
  return (
    <div className={styles.modalBackdrop}>
      <ModalLayout
        hideFooter
        wrapperStyle={{
          width: '300px',
          height: '100px',
        }}
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <AutoProgressBar percent={uploadedBytes / totalBytes} timeTarget={1000 * 60} />
        <button className="button button--default" onClick={cancelUpload}>
          {$t('Cancel')}
        </button>
      </ModalLayout>
    </div>
  );
}
