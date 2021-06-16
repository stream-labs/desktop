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
import BlankSlate from 'components-react/highlighter/BlankSlate';
import { SCRUB_HEIGHT, SCRUB_WIDTH } from 'services/highlighter/constants';
import electron from 'electron';
import path from 'path';

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
    const newOrder = clips.filter(c => c.id !== 'add').map(c => c.id);

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
    const clipList = [{ id: 'add', filtered: true }, ...v.clips.map(c => ({ id: c.path }))];

    function onDrop(e: React.DragEvent<HTMLDivElement>) {
      // TODO: Figure out what extensions we support
      const extensions = ['.mp4', '.webm', '.flv'];
      const files: string[] = [];
      let fi = e.dataTransfer.files.length;
      while (fi--) {
        const file = e.dataTransfer.files.item(fi)?.path;
        if (file) files.push(file);
      }
      console.log(files);

      const filtered = files.filter(f => extensions.includes(path.parse(f).ext));

      console.log(filtered);

      if (filtered.length) {
        HighlighterService.actions.addClips(filtered);
      }

      e.stopPropagation();
    }

    return (
      <div
        style={{ width: '100%', display: 'flex' }}
        className={styles.clipsViewRoot}
        onDrop={onDrop}
      >
        <div style={{ overflowY: 'auto', flexGrow: 1 }}>
          <ReactSortable
            list={clipList}
            setList={setClipOrder}
            animation={200}
            filter=".sortable-ignore"
            onMove={e => {
              return e.related.className.indexOf('sortable-ignore') === -1;
            }}
          >
            <div
              key="add"
              style={{ margin: '10px', display: 'inline-block' }}
              className="sortable-ignore"
            >
              <AddClip />
            </div>
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

  if (!v.clips.length) return <BlankSlate />;
  if (!v.loaded) return getLoadingView();

  return getClipsView();
}

function AddClip() {
  const { HighlighterService } = Services;

  async function openClips() {
    const selections = await electron.remote.dialog.showOpenDialog(
      electron.remote.getCurrentWindow(),
      {
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Video Files', extensions: ['mp4', 'webm', 'flv'] }],
      },
    );

    if (selections && selections.filePaths) {
      HighlighterService.actions.addClips(selections.filePaths);
    }
  }

  return (
    <div
      style={{
        width: `${SCRUB_WIDTH}px`,
        height: `${SCRUB_HEIGHT}px`,
      }}
      className={styles.addClip}
      onClick={openClips}
    >
      <div style={{ fontSize: 24, textAlign: 'center', marginTop: 50 }}>
        <i className="icon-add" style={{ marginRight: 8 }} />
        Add Clip
      </div>
      <p style={{ textAlign: 'center' }}>{'Drag & drop or click to add clips'}</p>
    </div>
  );
}
