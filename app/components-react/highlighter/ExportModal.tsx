import React, { useState } from 'react';
import styles from '../pages/Highlighter.m.less';
import { EExportStep } from 'services/highlighter';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { FileInput, TextInput } from 'components-react/shared/inputs';
import Form from 'components-react/shared/inputs/Form';
import path from 'path';

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

  // TODO: When export is clicked, actually set the export file before exporting
  // TODO: Give warning overwriting

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
        </Form>
      </div>
    );
  }

  function getExportProgress() {
    return (
      <div>
        <h2>Export Progress</h2>
        {!v.exportInfo.cancelRequested && v.exportInfo.step === EExportStep.FrameRender && (
          <span>
            Rendering Frames: {v.exportInfo.currentFrame}/{v.exportInfo.totalFrames}
          </span>
        )}
        {!v.exportInfo.cancelRequested && v.exportInfo.step === EExportStep.AudioMix && (
          <span>
            Mixing Audio:
            <i className="fa fa-pulse fa-spinner" style={{ marginLeft: '12px' }} />
          </span>
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
  return getFileExportStep();
}
