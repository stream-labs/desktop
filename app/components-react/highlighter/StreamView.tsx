import { useVuex } from 'components-react/hooks';
import React, { useRef, useState } from 'react';
import { Services } from 'components-react/service-provider';
import styles from './StreamView.m.less';
import { EHighlighterView, IViewState, StreamInfoForAiHighlighter } from 'services/highlighter';
import isEqual from 'lodash/isEqual';
import { Modal, Button, Alert } from 'antd';
import ExportModal from 'components-react/highlighter/ExportModal';
import { SUPPORTED_FILE_TYPES } from 'services/highlighter/constants';
import Scrollable from 'components-react/shared/Scrollable';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';
import uuid from 'uuid';
import StreamCard from './StreamCard';
import path from 'path';
import PreviewModal from './PreviewModal';
import moment from 'moment';

type TModalStreamView =
  | { type: 'export'; id: string | undefined }
  | { type: 'preview'; id: string | undefined }
  | { type: 'upload' }
  | { type: 'remove'; id: string | undefined }
  | null;

export default function StreamView({ emitSetView }: { emitSetView: (data: IViewState) => void }) {
  const { HighlighterService, HotkeysService, UsageStatisticsService } = Services;
  const v = useVuex(() => ({
    exportInfo: HighlighterService.views.exportInfo,
    error: HighlighterService.views.error,
    uploadInfo: HighlighterService.views.uploadInfo,
  }));

  // Below is only used because useVueX doesnt work as expected
  // there probably is a better way to do this
  const currentStreams = useRef<{ id: string; date: string }[]>();
  const highlightedStreams = useVuex(() => {
    const newStreamIds = [
      ...HighlighterService.views.highlightedStreams.map(stream => {
        return { id: stream.id, date: stream.date };
      }),
    ];

    if (currentStreams.current === undefined || !isEqual(currentStreams.current, newStreamIds)) {
      currentStreams.current = newStreamIds;
    }
    return currentStreams.current.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  });

  const currentAiDetectionState = useRef<boolean>();

  const aiDetectionInProgress = useVuex(() => {
    const newDetectionInProgress = HighlighterService.views.highlightedStreams.some(
      stream => stream.state.type === 'detection-in-progress',
    );

    if (
      currentAiDetectionState.current === undefined ||
      !isEqual(currentAiDetectionState.current, newDetectionInProgress)
    ) {
      currentAiDetectionState.current = newDetectionInProgress;
    }
    return currentAiDetectionState.current;
  });

  const [showModal, rawSetShowModal] = useState<TModalStreamView | null>(null);
  const [modalWidth, setModalWidth] = useState('700px');
  const [clipsOfStreamAreLoading, setClipsOfStreamAreLoading] = useState<string | null>(null);

  // This is kind of weird, but ensures that modals stay the right
  // size while the closing animation is played. This is why modal
  // width has its own state. This makes sure we always set the right
  // size whenever displaying a modal.
  function setShowModal(modal: TModalStreamView | null) {
    rawSetShowModal(modal);

    if (modal && modal.type) {
      setModalWidth(
        {
          trim: '60%',
          preview: '700px',
          export: '700px',
          remove: '400px',
          upload: '400px',
        }[modal.type],
      );
    }
  }

  async function previewVideo(id: string) {
    setClipsOfStreamAreLoading(id);

    try {
      await HighlighterService.actions.return.loadClips(id);
      setClipsOfStreamAreLoading(null);
      rawSetShowModal({ type: 'preview', id });
    } catch (error: unknown) {
      console.error('Error loading clips for preview export', error);
      setClipsOfStreamAreLoading(null);
    }
  }

  async function exportVideo(id: string) {
    setClipsOfStreamAreLoading(id);

    try {
      await HighlighterService.actions.return.loadClips(id);
      setClipsOfStreamAreLoading(null);
      rawSetShowModal({ type: 'export', id });
    } catch (error: unknown) {
      console.error('Error loading clips for export', error);
      setClipsOfStreamAreLoading(null);
    }
  }

  function ImportStreamModal({ close }: { close: () => void }) {
    const { HighlighterService } = Services;
    const [inputValue, setInputValue] = useState<string>('');

    function handleInputChange(event: any) {
      setInputValue(event.target.value);
    }

    async function aiDetectionForManualUpload(title: string) {
      const streamInfo: StreamInfoForAiHighlighter = {
        id: 'manual_' + uuid(),
        title,
        game: 'Fortnite',
      };

      let filePath: string[] | undefined = [];

      try {
        filePath = await importStreamFromDevice();
        if (filePath && filePath.length > 0) {
          HighlighterService.actions.flow(filePath[0], streamInfo);
          close();
        } else {
          // No file selected
        }
      } catch (error: unknown) {
        console.error('Error importing file from device', error);
      }
    }

    return (
      <>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '8px',
          }}
        >
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <h1 style={{ margin: 0 }}>Import stream</h1>
            <input
              style={{ width: '100%', color: 'black' }}
              type="text"
              name="name"
              placeholder="Set a title for your stream"
              onChange={handleInputChange}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            {' '}
            <Button type="default" onClick={() => close()}>
              Cancel
            </Button>
            <Button type="primary" onClick={() => aiDetectionForManualUpload(inputValue)}>
              Select video to start import
            </Button>
          </div>
        </div>
      </>
    );
  }

  async function importStreamFromDevice() {
    const selections = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile'],
      filters: [{ name: $t('Video Files'), extensions: SUPPORTED_FILE_TYPES }],
    });

    if (selections && selections.filePaths) {
      return selections.filePaths;
    }
  }

  function closeModal() {
    // Do not allow closing export modal while export/upload operations are in progress
    if (v.exportInfo.exporting) return;
    if (v.uploadInfo.uploading) return;

    setShowModal(null);

    if (v.error) HighlighterService.actions.dismissError();
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    const extensions = SUPPORTED_FILE_TYPES.map(e => `.${e}`);
    const files: string[] = [];
    let fi = e.dataTransfer.files.length;
    while (fi--) {
      const file = e.dataTransfer.files.item(fi)?.path;
      if (file) files.push(file);
    }

    const filtered = files.filter(f => extensions.includes(path.parse(f).ext));
    if (filtered.length) {
      const StreamInfoForAiHighlighter: StreamInfoForAiHighlighter = {
        id: 'manual_' + uuid(),
        game: 'Fortnite',
      };
      HighlighterService.actions.flow(filtered[0], StreamInfoForAiHighlighter);
    }

    e.preventDefault();
    e.stopPropagation();
  }

  function getStreamView() {
    return (
      <div
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
        className={styles.streamViewRoot}
        onDrop={event => onDrop(event)}
      >
        <div style={{ display: 'flex', padding: 20 }}>
          <div style={{ flexGrow: 1 }}>
            <h1 style={{ margin: 0 }}>My stream highlights</h1>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div
              className={styles.uploadWrapper}
              style={{
                opacity: aiDetectionInProgress ? '0.7' : '1',
                cursor: aiDetectionInProgress ? 'not-allowed' : 'pointer',
              }}
              onClick={() => !aiDetectionInProgress && setShowModal({ type: 'upload' })}
            >
              <i className="icon-upload-image" /> Drag or click to browse your file{' '}
              <Button disabled={aiDetectionInProgress === true}>Import</Button>
            </div>
            <Button onClick={() => emitSetView({ view: EHighlighterView.SETTINGS })}>
              Settings
            </Button>
          </div>
        </div>

        <Scrollable style={{ flexGrow: 1, padding: '20px 0 20px 20px' }}>
          {highlightedStreams.length === 0 ? (
            <>No highlight clips created from streams</> // TODO: Add empty state
          ) : (
            Object.entries(groupStreamsByTimePeriod(highlightedStreams)).map(
              ([period, streams]) =>
                streams.length > 0 && (
                  <React.Fragment key={period}>
                    <div
                      style={{
                        borderBottom: '1px solid var(--border)',
                        margin: '20px 0',
                        paddingBottom: '10px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                      }}
                    >
                      {period}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      {streams.map(stream => (
                        <StreamCard
                          key={stream.id}
                          streamId={stream.id}
                          emitSetView={data => emitSetView(data)}
                          emitGeneratePreview={() => previewVideo(stream.id)}
                          emitExportVideo={() => exportVideo(stream.id)}
                          emitRemoveStream={() => setShowModal({ type: 'remove', id: stream.id })}
                          clipsOfStreamAreLoading={clipsOfStreamAreLoading}
                          emitCancelHighlightGeneration={() => {
                            HighlighterService.actions.cancelHighlightGeneration(stream.id);
                          }}
                        />
                      ))}
                    </div>
                  </React.Fragment>
                ),
            )
          )}
        </Scrollable>

        <Modal
          getContainer={`.${styles.streamViewRoot}`}
          onCancel={closeModal}
          footer={null}
          width={modalWidth}
          closable={false}
          visible={!!showModal}
          destroyOnClose={true}
          keyboard={false}
        >
          {!!v.error && <Alert message={v.error} type="error" showIcon />}
          {showModal?.type === 'upload' && <ImportStreamModal close={closeModal} />}
          {showModal?.type === 'export' && (
            <ExportModal close={closeModal} streamId={showModal.id} />
          )}
          {showModal?.type === 'preview' && (
            <PreviewModal close={closeModal} streamId={showModal.id} />
          )}
          {showModal?.type === 'remove' && (
            <RemoveStream close={closeModal} streamId={showModal.id} />
          )}
        </Modal>
      </div>
    );
  }

  return getStreamView();
}

function RemoveStream(p: { streamId: string | undefined; close: () => void }) {
  const { HighlighterService } = Services;

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Delete highlighted Stream?</h2>
      <p>
        Are you sure you want to delete this stream and all its associated clips? This action cannot
        be undone.
      </p>
      <Button style={{ marginRight: 8 }} onClick={p.close}>
        {$t('Cancel')}
      </Button>
      <Button
        type="primary"
        danger
        onClick={() => {
          if (p.streamId === undefined) {
            console.error('Cant remove stream, missing id');
            return;
          }
          HighlighterService.actions.removeStream(p.streamId);
          p.close();
        }}
      >
        {'Delete'}
      </Button>
    </div>
  );
}

export function groupStreamsByTimePeriod(streams: { id: string; date: string }[]) {
  const now = moment();
  const groups: { [key: string]: typeof streams } = {
    Today: [],
    Yesterday: [],
    'This week': [],
    'Last week': [],
    'This month': [],
    'Last month': [],
  };
  const monthGroups: { [key: string]: typeof streams } = {};

  streams.forEach(stream => {
    const streamDate = moment(stream.date);
    if (streamDate.isSame(now, 'day')) {
      groups['Today'].push(stream);
    } else if (streamDate.isSame(now.clone().subtract(1, 'day'), 'day')) {
      groups['Yesterday'].push(stream);
    } else if (streamDate.isSame(now, 'week')) {
      groups['This week'].push(stream);
    } else if (streamDate.isSame(now.clone().subtract(1, 'week'), 'week')) {
      groups['Last week'].push(stream);
    } else if (streamDate.isSame(now, 'month')) {
      groups['This month'].push(stream);
    } else if (streamDate.isSame(now.clone().subtract(1, 'month'), 'month')) {
      groups['Last month'].push(stream);
    } else {
      const monthKey = streamDate.format('MMMM YYYY');
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(stream);
    }
  });

  return { ...groups, ...monthGroups };
}
