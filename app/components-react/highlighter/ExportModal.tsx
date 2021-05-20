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
import { TPrivacyStatus } from 'services/platforms/youtube/uploader';

// Source: https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/10420404
function humanFileSize(bytes: number, si: boolean) {
  const thresh = si ? 1000 : 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

function YoutubeUpload(props: { defaultTitle: string }) {
  const [title, setTitle] = useState(props.defaultTitle);
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const { UserService, HighlighterService } = Services;
  const v = useVuex(() => ({
    youtubeLinked: !!UserService.state.auth?.platforms.youtube,
    uploadInfo: HighlighterService.views.uploadInfo,
    exportInfo: HighlighterService.views.exportInfo,
  }));

  function getYoutubeForm() {
    return (
      <div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ flexGrow: 1 }}>
            <Form layout="vertical">
              <TextInput label="Title" value={title} onInput={setTitle} uncontrolled={false} />
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
                  {
                    label: 'Public',
                    value: 'public',
                    description: 'Everyone can watch your video',
                  },
                ]}
                value={privacy}
                onChange={setPrivacy}
              />
            </Form>
          </div>
          <div
            style={{
              width: 300,
              marginLeft: 24,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <video
              src={v.exportInfo.file}
              controls
              style={{
                width: '100%',
                borderTopRightRadius: 8,
                borderTopLeftRadius: 8,
                outline: 'none',
              }}
            />
            <div
              style={{
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                background: 'var(--section)',
                fontWeight: 800,
                padding: 12,
              }}
            >
              {title}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            onClick={() => {
              HighlighterService.actions.upload({
                title,
                description,
                privacyStatus: privacy as TPrivacyStatus,
              });
            }}
          >
            Publish
          </Button>
        </div>
      </div>
    );
  }

  function getUploadProgress() {
    return (
      <div>
        <h2>Upload Progress</h2>
        <Progress
          percent={Math.round((v.uploadInfo.uploadedBytes / v.uploadInfo.totalBytes) * 100)}
          trailColor="var(--section)"
          status={v.uploadInfo.cancelRequested ? 'exception' : 'normal'}
        />
        {!v.uploadInfo.cancelRequested && (
          <div>
            Uploading: {humanFileSize(v.uploadInfo.uploadedBytes, false)}/
            {humanFileSize(v.uploadInfo.totalBytes, false)}
          </div>
        )}
        {v.uploadInfo.cancelRequested && <span>Canceling...</span>}
        <br />
        <button
          className="button button--soft-warning"
          onClick={() => HighlighterService.actions.cancelUpload()}
          style={{ marginTop: '16px' }}
          disabled={v.uploadInfo.cancelRequested}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Upload to YouTube</h2>
      {v.youtubeLinked && !v.uploadInfo.uploading && getYoutubeForm()}
      {v.youtubeLinked && v.uploadInfo.uploading && getUploadProgress()}
      {!v.youtubeLinked && <div>TODO: Youtube is not linked</div>}
    </div>
  );
}

export default function ExportModal() {
  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    exportInfo: HighlighterService.views.exportInfo,
  }));

  function getExportFileFromVideoName(videoName: string) {
    const parsed = path.parse(v.exportInfo.file);
    return path.join(parsed.dir, `${videoName}${parsed.ext}`);
  }

  function getVideoNameFromExportFile(exportFile: string) {
    return path.parse(exportFile).name;
  }

  // Video name and export file are kept in sync
  const [videoName, setVideoName] = useState('My Video');
  const [exportFile, setExportFile] = useState<string>(getExportFileFromVideoName(videoName));

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
