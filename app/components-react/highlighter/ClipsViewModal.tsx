import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { useEffect, useState } from 'react';
import { TModalClipsView } from './ClipsView';
import { TClip } from 'services/highlighter';
import styles from './ClipsView.m.less';
import ClipTrimmer from 'components-react/highlighter/ClipTrimmer';
import { Modal, Alert } from 'antd';
import ExportModal from 'components-react/highlighter/ExportModal';
import PreviewModal from 'components-react/highlighter/PreviewModal';
import React from 'react';

export default function ClipsViewModal({
  streamId,
  modal,
  onClose,
}: {
  streamId: string | undefined;
  modal: TModalClipsView | null;
  onClose: () => void;
}) {
  const { HighlighterService, HotkeysService, UsageStatisticsService } = Services;
  const v = useVuex(() => ({
    exportInfo: HighlighterService.views.exportInfo,
    uploadInfo: HighlighterService.views.uploadInfo,
    error: HighlighterService.views.error,
  }));
  const [showModal, rawSetShowModal] = useState<TModalClipsView | null>(null);
  const [modalWidth, setModalWidth] = useState('700px');
  useEffect(() => {
    setShowModal(modal);
  }, [modal]);
  const [inspectedClipPath, setInspectedClipPath] = useState<string | null>(null);
  const inspectedClip: TClip | null = inspectedClipPath
    ? HighlighterService.views.clipsDictionary[inspectedClipPath] ?? null
    : null;

  function setShowModal(modal: TModalClipsView | null) {
    rawSetShowModal(modal);

    if (modal) {
      setModalWidth(
        {
          trim: '60%',
          preview: '700px',
          export: '700px',
          remove: '400px',
        }[modal],
      );
    }
  }
  function closeModal() {
    // Do not allow closing export modal while export/upload operations are in progress
    if (v.exportInfo.exporting) return;
    if (v.uploadInfo.uploading) return;

    setInspectedClipPath(null);
    setShowModal(null);
    onClose();
    if (v.error) HighlighterService.actions.dismissError();
  }

  return (
    <Modal
      getContainer={`.${styles.clipsViewRoot}`}
      onCancel={closeModal}
      footer={null}
      width={modalWidth}
      closable={false}
      visible={!!showModal || !!v.error}
      destroyOnClose={true}
      keyboard={false}
    >
      {!!v.error && <Alert message={v.error} type="error" showIcon />}
      {inspectedClip && showModal === 'trim' && <ClipTrimmer clip={inspectedClip} />}
      {showModal === 'export' && <ExportModal close={closeModal} streamId={streamId} />}
      {showModal === 'preview' && <PreviewModal close={closeModal} streamId={streamId} />}
      {/* {inspectedClip && showModal === 'remove' && (
          <RemoveClip close={closeModal} clip={inspectedClip} streamId={streamId} />
        )} */}
    </Modal>
  );
}

// I need to react properly here when the modalType changes
