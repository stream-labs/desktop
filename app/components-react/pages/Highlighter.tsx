import { useVuex } from 'components-react/hooks';
import React, { useEffect, useState } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './Highlighter.m.less';
import { IClip } from 'services/highlighter';
import ClipPreview from 'components-react/highlighter/ClipPreview';
import ClipTrimmer from 'components-react/highlighter/ClipTrimmer';
import { ReactSortable } from 'react-sortablejs';
import { ListInput } from 'components-react/shared/inputs/ListInput';
import Form from 'components-react/shared/inputs/Form';
import isEqual from 'lodash/isEqual';
import { SliderInput } from 'components-react/shared/inputs';
import { Modal, Button } from 'antd';
import ExportModal from 'components-react/highlighter/ExportModal';
import PreviewModal from 'components-react/highlighter/PreviewModal';

type TModal = 'trim' | 'export' | 'preview';

export default function Highlighter() {
  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    clips: HighlighterService.views.clips as IClip[],
    exportInfo: HighlighterService.views.exportInfo,
    uploadInfo: HighlighterService.views.uploadInfo,
    loadedCount: HighlighterService.views.loadedCount,
    loaded: HighlighterService.views.loaded,
    transition: HighlighterService.views.transition,
  }));

  useEffect(() => HighlighterService.actions.loadClips(), [v.clips.length]);

  const [showModal, setShowModal] = useState<TModal | null>(null);

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
        </Form>
        <Button
          style={{ marginTop: '16px', marginRight: '8px' }}
          onClick={() => setShowModal('preview')}
        >
          Preview
        </Button>
        <Button type="primary" style={{ marginTop: '16px' }} onClick={() => setShowModal('export')}>
          Export
        </Button>
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

  const [inspectedClipPath, setInspectedClipPath] = useState<string | null>(null);
  let inspectedClip: IClip | null;

  if (inspectedClipPath) {
    inspectedClip = v.clips.find(c => c.path === inspectedClipPath) ?? null;
  }

  function closeModal() {
    // Do not allow closing export modal while export/upload operations are in progress
    if (v.exportInfo.exporting) return;
    if (v.uploadInfo.uploading) return;

    setInspectedClipPath(null);
    setShowModal(null);
  }

  function getClipsView() {
    const clipList = v.clips.map(c => ({ id: c.path }));

    return (
      <div style={{ width: '100%', display: 'flex' }} className={styles.clipsViewRoot}>
        <div style={{ overflowY: 'auto', flexGrow: 1 }}>
          <ReactSortable list={clipList} setList={setClipOrder} animation={200}>
            {v.clips.map(clip => {
              return (
                <div key={clip.path} style={{ margin: '10px', display: 'inline-block' }}>
                  <ClipPreview
                    clip={clip}
                    onClick={() => {
                      setInspectedClipPath(clip.path);
                      setShowModal('trim');
                    }}
                  />
                </div>
              );
            })}
          </ReactSortable>
        </div>
        {getControls()}
        <Modal
          getContainer={`.${styles.clipsViewRoot}`}
          onCancel={closeModal}
          footer={null}
          width={showModal === 'trim' ? '60%' : '700px'}
          closable={false}
          visible={!!showModal}
          destroyOnClose={true}
        >
          {inspectedClip && showModal === 'trim' && <ClipTrimmer clip={inspectedClip} />}
          {showModal === 'export' && <ExportModal close={closeModal} />}
          {showModal === 'preview' && <PreviewModal close={closeModal} />}
        </Modal>
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

  if (!v.clips.length) return getBlankSlate();
  if (!v.loaded) return getLoadingView();

  return getClipsView();
}
