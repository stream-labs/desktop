import React, { useEffect, useMemo } from 'react';
import * as remote from '@electron/remote';
import { Tooltip } from 'antd';
import { $t } from 'services/i18n';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import styles from './RecordingHistory.m.less';
import AutoProgressBar from 'components-react/shared/AutoProgressBar';
import { GetSLID } from 'components-react/highlighter/StorageUpload';
import { ENotificationType } from 'services/notifications';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from '../service-provider';
import { initStore, useController } from '../hooks/zustand';
import { useVuex } from '../hooks';
import Translate from 'components-react/shared/Translate';
import uuid from 'uuid/v4';

const RecordingHistoryCtx = React.createContext<RecordingHistoryController | null>(null);

class RecordingHistoryController {
  private RecordingModeService = Services.RecordingModeService;
  private UserService = Services.UserService;
  private SharedStorageService = Services.SharedStorageService;
  private NotificationsService = Services.NotificationsService;
  private HighlighterService = Services.HighlighterService;
  private NavigationService = Services.NavigationService;
  store = initStore({ showSLIDModal: false });

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
    const opts = [
      {
        label: $t('Highlight'),
        value: 'highlighter',
        icon: 'icon-editor-7',
      },
      {
        label: $t('Clip'),
        value: 'crossclip',
        icon: 'icon-editor-7',
      },
      {
        label: $t('Subtitle'),
        value: 'typestudio',
        icon: 'icon-mic',
      },
      {
        label: $t('Edit'),
        value: 'videoeditor',
        icon: 'icon-play-round',
      },
    ];
    if (this.hasYoutube) {
      opts.unshift({
        label: $t('Upload'),
        value: 'youtube',
        icon: 'icon-youtube',
      });
    }

    return opts;
  }

  postError(message: string) {
    this.NotificationsService.actions.push({
      message,
      type: ENotificationType.WARNING,
      lifeTime: 5000,
    });
  }

  handleSelect(filename: string, platform: string) {
    if (this.uploadInfo.uploading) {
      this.postError($t('Upload already in progress'));
      return;
    }
    if (platform === 'highlighter') {
      this.HighlighterService.actions.flow(filename, {
        game: 'forntnite',
        id: 'rec_' + uuid(),
        title: extractDateTimeFromPath(filename) || 'Recording',
      });
      this.NavigationService.actions.navigate('Highlighter', { view: 'stream' });
      return;
    }

    if (platform === 'youtube') return this.uploadToYoutube(filename);
    if (this.hasSLID) {
      this.uploadToStorage(filename, platform);
    } else {
      this.store.setState(s => {
        s.showSLIDModal = true;
      });
    }

    function extractDateTimeFromPath(filePath: string): string | undefined {
      try {
        const parts = filePath.split(/[/\\]/);
        const fileName = parts[parts.length - 1];
        const dateTimePart = fileName.split('.')[0];
        return dateTimePart;
      } catch (error: unknown) {
        return undefined;
      }
    }
  }

  formattedTimestamp(timestamp: string) {
    return this.RecordingModeService.views.formattedTimestamp(timestamp);
  }

  async uploadToYoutube(filename: string) {
    const id = await this.RecordingModeService.actions.return.uploadToYoutube(filename);
    if (!id) return;
    remote.shell.openExternal(`https://youtube.com/watch?v=${id}`);
  }

  async uploadToStorage(filename: string, platform: string) {
    const id = await this.RecordingModeService.actions.return.uploadToStorage(filename, platform);
    if (!id) return;
    remote.shell.openExternal(this.SharedStorageService.views.getPlatformLink(platform, id));
  }

  showFile(filename: string) {
    remote.shell.showItemInFolder(filename);
  }

  cancelUpload() {
    this.RecordingModeService.actions.cancelUpload();
  }
}

export default function RecordingHistoryPage() {
  const controller = useMemo(() => new RecordingHistoryController(), []);
  return (
    <RecordingHistoryCtx.Provider value={controller}>
      <RecordingHistory />
    </RecordingHistoryCtx.Provider>
  );
}

export function RecordingHistory() {
  const controller = useController(RecordingHistoryCtx);
  const { formattedTimestamp, showFile, handleSelect, postError } = controller;
  const { uploadInfo, uploadOptions, recordings, hasSLID } = useVuex(() => ({
    recordings: controller.recordings,
    uploadOptions: controller.uploadOptions,
    uploadInfo: controller.uploadInfo,
    hasSLID: controller.hasSLID,
  }));

  useEffect(() => {
    if (
      uploadInfo.error &&
      typeof uploadInfo.error === 'string' &&
      // We don't want to surface unexpected TS errors to the user
      !/TypeError/.test(uploadInfo.error)
    ) {
      postError(uploadInfo.error);
    }
  }, [uploadInfo.error]);

  function openMarkersSettings() {
    Services.SettingsService.actions.showSettings('Hotkeys');
  }

  function UploadActions(p: { filename: string }) {
    return (
      <span className={styles.actionGroup}>
        {uploadOptions.map(opt => (
          <span
            className={styles.action}
            key={opt.value}
            style={{ color: `var(--${opt.value === 'youtube' ? 'title' : opt.value})` }}
            onClick={() => handleSelect(p.filename, opt.value)}
          >
            <i className={opt.icon} />
            &nbsp;
            <span>{opt.label}</span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <div className={styles.container}>
      <h1>{$t('Recordings')}</h1>
      <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column' }}>
        {$t(
          'Record your screen with Streamlabs Desktop. Once recording is complete, it will be displayed here. Access your files or edit further with Streamlabs tools.',
        )}
        <Translate message="<color>Pro tip:</color> set Markers in Hotkeys settings to timestamp your recordings. <link>Set up here</link>">
          <span slot="color" className={styles.tipHighlight} />
          <a slot="link" onClick={openMarkersSettings} className={styles.tipLink} />
        </Translate>
      </div>
      <div className={styles.recordingsContainer} id="recordingHistory">
        <Scrollable style={{ height: '100%' }}>
          {recordings.map(recording => (
            <div className={styles.recording} key={recording.timestamp}>
              <span style={{ marginRight: '8px' }}>{formattedTimestamp(recording.timestamp)}</span>
              <Tooltip title={$t('Show in folder')}>
                <span onClick={() => showFile(recording.filename)} className={styles.filename}>
                  {recording.filename}
                </span>
              </Tooltip>
              {uploadOptions.length > 0 && <UploadActions filename={recording.filename} />}
            </div>
          ))}
        </Scrollable>
      </div>
      <ExportModal />
      {!hasSLID && <SLIDModal />}
    </div>
  );
}

function SLIDModal() {
  const { store } = useController(RecordingHistoryCtx);
  const showSLIDModal = store.useState(s => s.showSLIDModal);

  if (!showSLIDModal) return <></>;

  function loginSuccess() {
    store.setState({ showSLIDModal: false });
  }

  return (
    <div className={styles.modalBackdrop}>
      <ModalLayout
        hideFooter
        wrapperStyle={{
          width: '450px',
          height: '300px',
        }}
        bodyStyle={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <GetSLID onLogin={loginSuccess} />
      </ModalLayout>
    </div>
  );
}

function ExportModal() {
  const { uploadInfo, cancelUpload } = useController(RecordingHistoryCtx);
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
