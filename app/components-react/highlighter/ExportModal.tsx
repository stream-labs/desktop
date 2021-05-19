import React, { useState } from 'react';
import styles from '../pages/Highlighter.m.less';
import { EExportStep } from 'services/highlighter';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { FileInput, TextInput, TextAreaInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import path from 'path';
import { Button, Progress } from 'antd';
import { RadioInput } from 'components-react/shared/inputs/RadioInput';

function YoutubeUpload(props: { defaultTitle: string }) {
  const [title, setTitle] = useState(props.defaultTitle);
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('private');

  return (
    <div>
      <h2>Upload to YouTube</h2>
      <Form>
        <TextInput label="Title" value={title} onChange={setTitle} />
        <TextAreaInput label="Description" value={description} onChange={setDescription} />
        <RadioInput
          label="Privacy Status"
          options={[
            {
              label: 'Private',
              value: 'private',
              description: 'Only you and people you choose can watch your video',
            },
            {
              label: 'Unlisted',
              value: 'unlisted',
              description: 'Anyone with the video link can watch your video',
            },
            { label: 'Public', value: 'public', description: 'Everyone can watch your video' },
          ]}
          value={privacy}
          onChange={setPrivacy}
        />
        <div style={{ textAlign: 'right' }}>
          <Button type="primary">Publish</Button>
        </div>
      </Form>
    </div>
  );
}

export default function ExportModal() {
  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    exportInfo: HighlighterService.views.exportInfo,
  }));
  // Video name and export file are kept in sync
  const [videoName, setVideoName] = useState('My Video');
  const [exportFile, setExportFile] = useState<string>(getExportFileFromVideoName(videoName));

  function getExportFileFromVideoName(videoName: string) {
    const parsed = path.parse(v.exportInfo.file);
    return path.join(parsed.dir, `${videoName}${parsed.ext}`);
  }

  function getVideoNameFromExportFile(exportFile: string) {
    return path.parse(exportFile).name;
  }

  // TODO: Give warning overwriting
  // TODO: Show confirm when closing modal after export

  function getFileExportStep() {
    return (
      <div>
        <h2>Export Video</h2>
        <Form>
          <TextInput
            label="Video Name"
            value={videoName}
            onInput={name => {
              setVideoName(name);
              setExportFile(getExportFileFromVideoName(name));
            }}
            uncontrolled={false}
          />
          <FileInput
            label="Export Location"
            save={true}
            filters={[{ name: 'MP4 Video File', extensions: ['mp4'] }]}
            value={exportFile}
            onChange={file => {
              setExportFile(file);
              setVideoName(getVideoNameFromExportFile(file));
            }}
          />
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              onClick={() => {
                HighlighterService.actions.setExportFile(exportFile);
                HighlighterService.actions.export();
              }}
            >
              Export
            </Button>
          </div>
        </Form>
      </div>
    );
  }

  function getExportProgress() {
    return (
      <div>
        <h2>Export Progress</h2>
        <Progress
          percent={Math.round((v.exportInfo.currentFrame / v.exportInfo.totalFrames) * 100)}
          trailColor="var(--section)"
          status={v.exportInfo.cancelRequested ? 'exception' : 'normal'}
        />
        {!v.exportInfo.cancelRequested && v.exportInfo.step === EExportStep.FrameRender && (
          <div>
            Rendering Frames: {v.exportInfo.currentFrame}/{v.exportInfo.totalFrames}
          </div>
        )}
        {!v.exportInfo.cancelRequested && v.exportInfo.step === EExportStep.AudioMix && (
          <div>
            Mixing Audio:
            <i className="fa fa-pulse fa-spinner" style={{ marginLeft: '12px' }} />
          </div>
        )}
        {v.exportInfo.cancelRequested && <span>Canceling...</span>}
        <br />
        <button
          className="button button--soft-warning"
          onClick={() => HighlighterService.actions.cancelExport()}
          style={{ marginTop: '16px' }}
          disabled={v.exportInfo.cancelRequested}
        >
          Cancel
        </button>
      </div>
    );
  }

  if (v.exportInfo.exporting) return getExportProgress();
  if (!v.exportInfo.exported) return getFileExportStep();
  return <YoutubeUpload defaultTitle={videoName} />;
}
