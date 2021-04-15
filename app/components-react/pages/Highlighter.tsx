import { useVuex } from 'components-react/hooks';
import React, { useEffect } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './Highlighter.m.less';
import { EExportStep } from 'services/highlighter';
import ClipPreview from 'components-react/highlighter/ClipPreview';

export default function Highlighter() {
  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    clips: HighlighterService.views.clips,
    exportInfo: HighlighterService.views.exportInfo,
    loadedCount: HighlighterService.views.loadedCount,
    loaded: HighlighterService.views.loaded,
  }));

  useEffect(() => HighlighterService.actions.loadClips(), [v.clips.length]);

  function getExportView() {
    return (
      <div className={styles.clipLoader}>
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

  function getLoadingView() {
    return (
      <div className={styles.clipLoader}>
        <h2>Loading</h2>
        {v.loadedCount}/{v.clips.length} Clips
      </div>
    );
  }

  function getControls() {
    return (
      <div
        style={{
          width: '300px',
          flexShrink: 0,
          background: 'var(--section)',
          borderLeft: '1px solid var(--border)',
          padding: '20px',
        }}
      >
        {/* TODO */}
        <button
          className="button button--action"
          style={{ marginTop: '16px' }}
          onClick={() => HighlighterService.actions.export()}
        >
          Export
        </button>
      </div>
    );
  }

  function getClipsView() {
    return (
      <div style={{ width: '100%', display: 'flex' }}>
        <div style={{ overflowY: 'auto' }}>
          {v.clips.map(clip => {
            return (
              <div key={clip.path} style={{ margin: '10px', display: 'inline-block' }}>
                <ClipPreview clip={clip} />
              </div>
            );
          })}
        </div>
        {getControls()}
      </div>
    );
  }

  function getBlankSlate() {
    return (
      <div style={{ fontSize: '16px', margin: 'auto' }}>
        Start the replay buffer and record some clips to get started!
      </div>
    );
  }

  if (v.exportInfo.exporting) return getExportView();
  if (!v.clips.length) return getBlankSlate();
  if (!v.loaded) return getLoadingView();

  return getClipsView();
}
