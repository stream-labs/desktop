import React from 'react';
import * as remote from '@electron/remote';
import path from 'path';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import styles from './ExportModal.m.less';
import { $t } from 'services/i18n';

export default function VideoPreview() {
  const { HighlighterService } = Services;
  const { exportInfo } = useVuex(() => ({
    exportInfo: HighlighterService.views.exportInfo,
  }));
  const filename = path.parse(exportInfo.file).base;

  return (
    <div className={styles.videoPreview}>
      <video src={HighlighterService.views.getCacheBustingUrl(exportInfo.file)} controls />

      {/* <div
        style={{
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          background: 'var(--section)',
          fontWeight: 800,
          padding: 12,
        }}
      >
        {filename}
        <br />
        <a
          onClick={() => {
            remote.shell.showItemInFolder(exportInfo.file);
          }}
        >
          {$t('Open file location')}
        </a>
      </div> */}
    </div>
  );
}
