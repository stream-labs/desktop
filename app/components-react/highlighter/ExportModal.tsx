import React, { useState, useEffect } from 'react';
import { EExportStep, TFPS, TResolution, TPreset } from 'services/highlighter';
import { Services } from 'components-react/service-provider';
import { FileInput, TextInput, ListInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import path from 'path';
import { Button, Progress, Alert } from 'antd';
import YoutubeUpload from './YoutubeUpload';
import { RadioInput } from 'components-react/shared/inputs/RadioInput';
import { confirmAsync } from 'components-react/modals';
import { $t } from 'services/i18n';
import { injectState, useModule } from 'slap';
import StorageUpload from './StorageUpload';
import { useVuex } from 'components-react/hooks';
import { EAvailableFeatures } from 'services/incremental-rollout';

class ExportModule {
  get service() {
    return Services.HighlighterService;
  }

  state = injectState({ videoName: 'My Video' });

  get exportInfo() {
    return this.service.views.exportInfo;
  }

  dismissError() {
    return this.service.actions.dismissError();
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

  exportCurrentFile() {
    this.service.actions.export();
  }

  cancelExport() {
    this.service.actions.cancelExport();
  }

  async clearUpload() {
    await this.service.actions.return.clearUpload();
  }

  async fileExists(exportFile: string) {
    return await this.service.actions.return.fileExists(exportFile);
  }
}

export default function ExportModal(p: { close: () => void }) {
  const { exportInfo, dismissError } = useModule(ExportModule);

  // Clear all errors when this component unmounts
  useEffect(dismissError, []);

  if (exportInfo.exporting) return <ExportProgress />;
  if (!exportInfo.exported) return <ExportOptions close={p.close} />;
  return <PlatformSelect onClose={p.close} />;
}

function ExportProgress() {
  const { exportInfo, cancelExport } = useModule(ExportModule);

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

function ExportOptions(p: { close: () => void }) {
  const { UsageStatisticsService } = Services;
  const {
    exportInfo,
    videoName,
    setVideoName,
    dismissError,
    setResolution,
    setFps,
    setPreset,
    fileExists,
    setExport,
    exportCurrentFile,
  } = useModule(ExportModule);
  function getExportFileFromVideoName(videoName: string) {
    const parsed = path.parse(exportInfo.file);
    const sanitized = videoName.replace(/[/\\?%*:|"<>\.,;=#]/g, '');
    return path.join(parsed.dir, `${sanitized}${parsed.ext}`);
  }

  function getVideoNameFromExportFile(exportFile: string) {
    return path.parse(exportFile).name;
  }
  // Video name and export file are kept in sync
  const [exportFile, setExportFile] = useState<string>(getExportFileFromVideoName(videoName));

  return (
    <div>
      <h2>Export Video</h2>
      <Form>
        <TextInput
          label={$t('Video Name')}
          value={videoName}
          onInput={name => {
            setVideoName(name);
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
            setVideoName(getVideoNameFromExportFile(file));
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
          <Button style={{ marginRight: 8 }} onClick={p.close}>
            {$t('Close')}
          </Button>
          <Button
            type="primary"
            onClick={async () => {
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
              exportCurrentFile();
            }}
          >
            {$t('Export')}
          </Button>
        </div>
      </Form>
    </div>
  );
}

function PlatformSelect(p: { onClose: () => void }) {
  const { videoName, clearUpload } = useModule(ExportModule);
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
      {platform === 'youtube' && <YoutubeUpload defaultTitle={videoName} close={p.onClose} />}
      {platform !== 'youtube' && <StorageUpload onClose={p.onClose} platform={platform} />}
    </Form>
  );
}
