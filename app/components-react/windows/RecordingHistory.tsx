import React from 'react';
import * as remote from '@electron/remote';
import { Tooltip } from 'antd';
import { inject, useModule } from 'slap';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
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

  get hasSLID() {
    return !!this.UserService.views.auth?.slid?.id;
  }

  get uploadInfo() {
    return this.RecordingModeService.state.uploadInfo;
  }

  get uploadOptions() {
    const opts = [];
    if (this.hasYoutube) opts.push({ label: 'YouTube', value: 'youtube' });
    if (this.hasSLID) {
      opts.push({ label: 'Cross Clip', value: 'crossclip' });
      opts.push({ label: 'TypeStudio', value: 'typestudio' });
    }

    return opts;
  }

  handleSelect(filename: string) {
    return (platform: string) => {
      if (platform === 'youtube') return this.uploadToYoutube(filename);
      this.uploadToStorage(filename, platform);
    };
  }

  formattedTimestamp(timestamp: string) {
    return this.RecordingModeService.views.formattedTimestamp(timestamp);
  }

  uploadToYoutube(filename: string) {
    this.RecordingModeService.actions.uploadToYoutube(filename);
  }

  getPlatformLink(platform: string, id: string) {
    if (platform === 'crossclip') {
      return `https://crossclip.streamlabs.com/storage/${id}`;
    }
    if (platform === 'typestudio') {
      return `https://app.typestudio.co/storage/${id}`;
    }
    return '';
  }

  async uploadToStorage(filename: string, platform: string) {
    const id = await this.RecordingModeService.actions.return.uploadToStorage(filename);
    if (!id) return;
    remote.shell.openExternal(this.getPlatformLink(platform, id));
  }

  showFile(filename: string) {
    remote.shell.showItemInFolder(filename);
  }

  cancelUpload() {
    this.RecordingModeService.actions.cancelUpload();
  }
}

export default function RecordingHistory() {
  const { recordings, formattedTimestamp, showFile, uploadOptions, handleSelect } = useModule(
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
            {uploadOptions.length > 0 && (
              <Form className={styles.uploadForm}>
                <ListInput
                  onSelect={handleSelect(recording.filename)}
                  label={$t('Upload To')}
                  options={uploadOptions}
                />
              </Form>
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
