import React, { useState, useEffect, useMemo } from 'react';
import {
  EExportStep,
  TFPS,
  TResolution,
  TPreset,
} from 'services/highlighter/models/rendering.models';
import { Services } from 'components-react/service-provider';
import { FileInput, TextInput, ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import path from 'path';
import { Button, Progress, Alert } from 'antd';
import YoutubeUpload from './YoutubeUpload';
import { RadioInput } from 'components-react/shared/inputs/RadioInput';
import { confirmAsync } from 'components-react/modals';
import { $t } from 'services/i18n';
import StorageUpload from './StorageUpload';
import { useVuex } from 'components-react/hooks';
import { initStore, useController } from '../hooks/zustand';
import { TOrientation } from 'services/highlighter/models/ai-highlighter.models';
import { fileExists } from 'services/highlighter/file-utils';

class ExportController {
  get service() {
    return Services.HighlighterService;
  }

  store = initStore({ videoName: 'My Video' });

  get exportInfo() {
    return this.service.views.exportInfo;
  }
  getStreamTitle(streamId?: string) {
    return (
      this.service.views.highlightedStreams.find(stream => stream.id === streamId)?.title ||
      'My Video'
    );
  }

  dismissError() {
    return this.service.actions.dismissError();
  }
  resetExportedState() {
    return this.service.actions.resetExportedState();
  }

  setResolution(value: string) {
    this.service.actions.setResolution(parseInt(value, 10) as TResolution);
  }

  setFps(value: string) {
    this.service.actions.setFps(parseInt(value, 10) as TFPS);
  }

  setPreset(value: string) {
    this.service.actions.setPreset(value as TPreset);
  }

  setExport(exportFile: string) {
    this.service.actions.setExportFile(exportFile);
  }

  exportCurrentFile(streamId: string | undefined, orientation: TOrientation = 'horizontal') {
    this.service.actions.export(false, streamId, orientation);
  }

  cancelExport() {
    this.service.actions.cancelExport();
  }

  async clearUpload() {
    await this.service.actions.return.clearUpload();
  }

  async fileExists(exportFile: string) {
    return await fileExists(exportFile);
  }
}

export const ExportModalCtx = React.createContext<ExportController | null>(null);

export default function ExportModalProvider({
  close,
  streamId,
}: {
  close: () => void;
  streamId: string | undefined;
}) {
  const controller = useMemo(() => new ExportController(), []);
  return (
    <ExportModalCtx.Provider value={controller}>
      <ExportModal close={close} streamId={streamId} />
    </ExportModalCtx.Provider>
  );
}

function ExportModal({ close, streamId }: { close: () => void; streamId: string | undefined }) {
  const { exportInfo, dismissError, resetExportedState, getStreamTitle } = useController(
    ExportModalCtx,
  );

  const [videoName, setVideoName] = useState<string>(getStreamTitle(streamId) + ' - highlights');

  const unmount = () => {
    dismissError();
    resetExportedState();
  };
  // Clear all errors when this component unmounts
  useEffect(() => unmount, []);

  if (exportInfo.exporting) return <ExportProgress />;
  if (!exportInfo.exported) {
    return (
      <ExportOptions
        close={close}
        streamId={streamId}
        videoName={videoName}
        onVideoNameChange={setVideoName}
      />
    );
  }
  return <PlatformSelect onClose={close} videoName={videoName} />;
}

function ExportProgress() {
  const { exportInfo, cancelExport } = useController(ExportModalCtx);

  return (
    <div>
      <h2>{$t('Export Progress')}</h2>
      <Progress
        percent={Math.round((exportInfo.currentFrame / exportInfo.totalFrames) * 100)}
        trailColor="var(--section)"
        status={exportInfo.cancelRequested ? 'exception' : 'normal'}
      />
      {!exportInfo.cancelRequested && exportInfo.step === EExportStep.FrameRender && (
        <div>
          {$t('Rendering Frames: %{currentFrame}/%{totalFrames}', {
            currentFrame: exportInfo.currentFrame,
            totalFrames: exportInfo.totalFrames,
          })}
        </div>
      )}
      {!exportInfo.cancelRequested && exportInfo.step === EExportStep.AudioMix && (
        <div>
          {$t('Mixing Audio:')}
          <i className="fa fa-pulse fa-spinner" style={{ marginLeft: '12px' }} />
        </div>
      )}
      {exportInfo.cancelRequested && <span>{$t('Canceling...')}</span>}
      <br />
      <button
        className="button button--soft-warning"
        onClick={cancelExport}
        style={{ marginTop: '16px' }}
        disabled={exportInfo.cancelRequested}
      >
        {$t('Cancel')}
      </button>
    </div>
  );
}

function ExportOptions({
  close,
  streamId,
  videoName,
  onVideoNameChange,
}: {
  close: () => void;
  streamId: string | undefined;
  videoName: string;
  onVideoNameChange: (name: string) => void;
}) {
  const { UsageStatisticsService } = Services;
  const {
    exportInfo,
    dismissError,
    setResolution,
    setFps,
    setPreset,
    fileExists,
    setExport,
    exportCurrentFile,
    getStreamTitle,
  } = useController(ExportModalCtx);

  // Video name and export file are kept in sync
  const [exportFile, setExportFile] = useState<string>(getExportFileFromVideoName(videoName));

  function getExportFileFromVideoName(videoName: string) {
    const parsed = path.parse(exportInfo.file);
    const sanitized = videoName.replace(/[/\\?%*:|"<>\.,;=#]/g, '');
    return path.join(parsed.dir, `${sanitized}${parsed.ext}`);
  }

  function getVideoNameFromExportFile(exportFile: string) {
    return path.parse(exportFile).name;
  }

  async function startExport(orientation: TOrientation) {
    if (await fileExists(exportFile)) {
      if (
        !(await confirmAsync({
          title: $t('Overwite File?'),
          content: $t('%{filename} already exists. Would you like to overwrite it?', {
            filename: path.basename(exportFile),
          }),
          okText: $t('Overwrite'),
        }))
      ) {
        return;
      }
    }

    UsageStatisticsService.actions.recordFeatureUsage('HighlighterExport');

    setExport(exportFile);
    exportCurrentFile(streamId, orientation);
  }

  return (
    <div>
      <h2>Export Video</h2>
      <Form>
        <TextInput
          label={$t('Video Name')}
          value={videoName}
          onInput={name => {
            onVideoNameChange(name);
            setExportFile(getExportFileFromVideoName(name));
          }}
          uncontrolled={false}
        />
        <FileInput
          label={$t('Export Location')}
          name="exportLocation"
          save={true}
          filters={[{ name: $t('MP4 Video File'), extensions: ['mp4'] }]}
          value={exportFile}
          onChange={file => {
            setExportFile(file);
            onVideoNameChange(getVideoNameFromExportFile(file));
          }}
        />
        <RadioInput
          label={$t('Resolution')}
          value={exportInfo.resolution.toString()}
          options={[
            { value: '720', label: '720p' },
            { value: '1080', label: '1080p' },
          ]}
          onChange={setResolution}
          buttons={true}
        />
        <RadioInput
          label={$t('Frame Rate')}
          value={exportInfo.fps.toString()}
          options={[
            { value: '30', label: '30 FPS' },
            { value: '60', label: '60 FPS' },
          ]}
          onChange={setFps}
          buttons={true}
        />
        <RadioInput
          label={$t('File Size')}
          value={exportInfo.preset}
          options={[
            { value: 'ultrafast', label: $t('Faster Export') },
            { value: 'fast', label: $t('Balanced') },
            { value: 'slow', label: $t('Smaller File') },
          ]}
          onChange={setPreset}
          buttons={true}
        />
        {exportInfo.error && (
          <Alert
            style={{ marginBottom: 24 }}
            message={exportInfo.error}
            type="error"
            closable
            showIcon
            afterClose={dismissError}
          />
        )}
        <div style={{ textAlign: 'right' }}>
          <Button style={{ marginRight: 8 }} onClick={close}>
            {$t('Close')}
          </Button>

          <Button style={{ marginRight: 8 }} type="primary" onClick={() => startExport('vertical')}>
            {$t('Export Vertical')}
          </Button>
          <Button type="primary" onClick={() => startExport('horizontal')}>
            {$t('Export Horizontal')}
          </Button>
        </div>
      </Form>
    </div>
  );
}

function PlatformSelect({
  onClose,
  videoName,
  streamId,
}: {
  onClose: () => void;
  videoName: string;
  streamId: string | undefined;
}) {
  const { store, clearUpload, getStreamTitle } = useController(ExportModalCtx);
  const { UserService } = Services;
  const { isYoutubeLinked } = useVuex(() => ({
    isYoutubeLinked: !!UserService.state.auth?.platforms.youtube,
  }));
  const [platform, setPlatform] = useState(() => (isYoutubeLinked ? 'youtube' : 'crossclip'));

  async function handlePlatformSelect(val: string) {
    if (platform === 'youtube') await clearUpload();
    setPlatform(val);
  }

  const platformOptions = [
    { label: 'YouTube', value: 'youtube' },
    { label: 'Cross Clip', value: 'crossclip' },
    { label: 'Podcast Editor', value: 'typestudio' },
    { label: 'Video Editor', value: 'videoeditor' },
  ];

  return (
    <Form>
      <h1 style={{ display: 'inline', marginRight: '16px', position: 'relative', top: '3px' }}>
        {$t('Upload To')}
      </h1>
      <ListInput
        value={platform}
        onChange={handlePlatformSelect}
        nowrap
        options={platformOptions}
      />
      {platform === 'youtube' && (
        <YoutubeUpload defaultTitle={videoName} close={onClose} streamId={streamId} />
      )}
      {platform !== 'youtube' && <StorageUpload onClose={onClose} platform={platform} />}
    </Form>
  );
}
