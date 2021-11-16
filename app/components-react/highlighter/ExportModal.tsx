import React, { useState, useEffect } from 'react';
import { EExportStep, TFPS, TResolution, TPreset } from 'services/highlighter';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { FileInput, TextInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import path from 'path';
import { Button, Progress, Alert } from 'antd';
import YoutubeUpload from './YoutubeUpload';
import { RadioInput } from 'components-react/shared/inputs/RadioInput';
import { confirmAsync } from 'components-react/modals';
import { $t } from 'services/i18n';

export default function ExportModal(p: { close: () => void }) {
  const { HighlighterService, UsageStatisticsService } = Services;
  const v = useVuex(() => ({
    exportInfo: HighlighterService.views.exportInfo,
  }));

  // Clear all errors when this component unmounts
  useEffect(() => {
    return () => HighlighterService.actions.dismissError();
  }, []);

  function getExportFileFromVideoName(videoName: string) {
    const parsed = path.parse(v.exportInfo.file);
    const sanitized = videoName.replace(/[/\\?%*:|"<>\.,;=#]/g, '');
    return path.join(parsed.dir, `${sanitized}${parsed.ext}`);
  }

  function getVideoNameFromExportFile(exportFile: string) {
    return path.parse(exportFile).name;
  }

  // Video name and export file are kept in sync
  const [videoName, setVideoName] = useState('My Video');
  const [exportFile, setExportFile] = useState<string>(getExportFileFromVideoName(videoName));

  function getFileExportStep() {
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
            value={v.exportInfo.resolution.toString()}
            options={[
              { value: '720', label: '720p' },
              { value: '1080', label: '1080p' },
            ]}
            onChange={val => {
              HighlighterService.actions.setResolution(parseInt(val, 10) as TResolution);
            }}
            buttons={true}
          />
          <RadioInput
            label={$t('Frame Rate')}
            value={v.exportInfo.fps.toString()}
            options={[
              { value: '30', label: '30 FPS' },
              { value: '60', label: '60 FPS' },
            ]}
            onChange={val => {
              HighlighterService.actions.setFps(parseInt(val, 10) as TFPS);
            }}
            buttons={true}
          />
          <RadioInput
            label={$t('File Size')}
            value={v.exportInfo.preset}
            options={[
              { value: 'ultrafast', label: $t('Faster Export') },
              { value: 'fast', label: $t('Balanced') },
              { value: 'slow', label: $t('Smaller File') },
            ]}
            onChange={val => {
              HighlighterService.actions.setPreset(val as TPreset);
            }}
            buttons={true}
          />
          {v.exportInfo.error && (
            <Alert
              style={{ marginBottom: 24 }}
              message={v.exportInfo.error}
              type="error"
              closable
              showIcon
              afterClose={() => HighlighterService.actions.dismissError()}
            />
          )}
          <div style={{ textAlign: 'right' }}>
            <Button style={{ marginRight: 8 }} onClick={p.close}>
              {$t('Close')}
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (await HighlighterService.actions.return.fileExists(exportFile)) {
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

                HighlighterService.actions.setExportFile(exportFile);
                HighlighterService.actions.export();
              }}
            >
              {$t('Export')}
            </Button>
          </div>
        </Form>
      </div>
    );
  }

  function getExportProgress() {
    return (
      <div>
        <h2>{$t('Export Progress')}</h2>
        <Progress
          percent={Math.round((v.exportInfo.currentFrame / v.exportInfo.totalFrames) * 100)}
          trailColor="var(--section)"
          status={v.exportInfo.cancelRequested ? 'exception' : 'normal'}
        />
        {!v.exportInfo.cancelRequested && v.exportInfo.step === EExportStep.FrameRender && (
          <div>
            {$t('Rendering Frames: %{currentFrame}/%{totalFrames}', {
              currentFrame: v.exportInfo.currentFrame,
              totalFrames: v.exportInfo.totalFrames,
            })}
          </div>
        )}
        {!v.exportInfo.cancelRequested && v.exportInfo.step === EExportStep.AudioMix && (
          <div>
            {$t('Mixing Audio:')}
            <i className="fa fa-pulse fa-spinner" style={{ marginLeft: '12px' }} />
          </div>
        )}
        {v.exportInfo.cancelRequested && <span>{$t('Canceling...')}</span>}
        <br />
        <button
          className="button button--soft-warning"
          onClick={() => HighlighterService.actions.cancelExport()}
          style={{ marginTop: '16px' }}
          disabled={v.exportInfo.cancelRequested}
        >
          {$t('Cancel')}
        </button>
      </div>
    );
  }

  if (v.exportInfo.exporting) return getExportProgress();
  if (!v.exportInfo.exported) return getFileExportStep();
  return <YoutubeUpload defaultTitle={videoName} close={p.close} />;
}
