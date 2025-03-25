import React, { useRef } from 'react';
import * as remote from '@electron/remote';
import path from 'path';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import styles from './ExportModal.m.less';
import { $t } from 'services/i18n';

export default function VideoPreview() {
  const { HighlighterService } = Services;
  const exportInfo = useRef(
    HighlighterService.views.getCacheBustingUrl(HighlighterService.views.exportInfo.file),
  );

  return (
    <div className={styles.videoPreview}>
      <video src={exportInfo.current} controls />
    </div>
  );
}
