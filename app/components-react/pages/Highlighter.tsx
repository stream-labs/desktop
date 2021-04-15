import { useVuex } from 'components-react/hooks';
import React, { useEffect } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './Highlighter.m.less';
import { EExportStep, IClip } from 'services/highlighter';
import ClipPreview from 'components-react/highlighter/ClipPreview';
import { ReactSortable } from 'react-sortablejs';
import { ListInput } from 'components-react/shared/inputs/ListInput';
import Form from 'components-react/shared/inputs/Form';
import isEqual from 'lodash/isEqual';
import { FileInput, SliderInput } from 'components-react/shared/inputs';

export default function Highlighter() {
  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    clips: HighlighterService.views.clips as IClip[],
    exportInfo: HighlighterService.views.exportInfo,
    loadedCount: HighlighterService.views.loadedCount,
    loaded: HighlighterService.views.loaded,
    transition: HighlighterService.views.transition,
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
    const transitionTypes = HighlighterService.views.transitions.map(
      (transition: { name: string }) => {
        return {
          value: transition.name,
          label: transition.name,
        };
      },
    );

    function setTransitionType(type: string) {
      HighlighterService.actions.setTransition({ type });
    }

    function setTransitionDuration(duration: number) {
      HighlighterService.actions.setTransition({ duration });
    }

    function setExportFile(file: string) {
      HighlighterService.actions.setExportFile(file);
    }

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
        <Form layout="vertical">
          <ListInput
            label="Transition Type"
            value={v.transition.type}
            options={transitionTypes}
            onChange={setTransitionType}
          />
          <SliderInput
            label="Transition Duration"
            value={v.transition.duration}
            onChange={setTransitionDuration}
            min={0.5}
            max={5}
            step={0.1}
            debounce={200}
            hasNumberInput={false}
            tooltipPlacement="bottom"
            tipFormatter={v => `${v}s`}
          />
          <FileInput
            label="Export File"
            save={true}
            filters={[{ name: 'MP4 Video File', extensions: ['mp4'] }]}
            value={v.exportInfo.file}
            onChange={setExportFile}
          />
        </Form>
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

  function setClipOrder(clips: { id: string }[]) {
    // ReactDraggable fires setList on mount. To avoid sync IPC,
    // we only fire off a request if the order changed.
    const oldOrder = v.clips.map(c => c.path);
    const newOrder = clips.map(c => c.id);

    if (!isEqual(oldOrder, newOrder)) {
      // Intentionally synchronous to avoid visual jank on drop
      HighlighterService.setOrder(newOrder);
    }
  }

  function getClipsView() {
    const clipList = v.clips.map(c => ({ id: c.path }));

    return (
      <div style={{ width: '100%', display: 'flex' }}>
        <div style={{ overflowY: 'auto' }}>
          <ReactSortable list={clipList} setList={setClipOrder} animation={200}>
            {v.clips.map(clip => {
              return (
                <div key={clip.path} style={{ margin: '10px', display: 'inline-block' }}>
                  <ClipPreview clip={clip} />
                </div>
              );
            })}
          </ReactSortable>
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
