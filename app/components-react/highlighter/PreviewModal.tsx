import { useVuex } from 'components-react/hooks';
import React, { useEffect, useRef } from 'react';
import { Services } from 'components-react/service-provider';
import { Progress, Alert } from 'antd';
import { $t } from 'services/i18n';

export default function PreviewModal(p: { close: () => void }) {
  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    exportInfo: HighlighterService.views.exportInfo,
  }));

  useEffect(() => {
    HighlighterService.actions.export(true);

    return () => HighlighterService.actions.cancelExport();
  }, []);

  // Clear all errors when this component unmounts
  useEffect(() => {
    return () => HighlighterService.actions.dismissError();
  }, []);

  // Kind of hacky but used to know if we ever were exporting at any point
  const didStartExport = useRef(false);
  if (v.exportInfo.exporting) didStartExport.current = true;

  useEffect(() => {
    // Close the window immediately if we stopped exporting due to cancel
    if (!v.exportInfo.exporting && v.exportInfo.cancelRequested && didStartExport.current) {
      p.close();
    }
  }, [v.exportInfo.exporting, v.exportInfo.cancelRequested]);

  return (
    <div>
      <h2>{$t('Render Preview')}</h2>
      <p>
        {$t(
          'The render preview shows a low-quality preview of the final rendered video. The final exported video will be higher resolution, framerate, and quality.',
        )}
      </p>
      {v.exportInfo.exporting && (
        <Progress
          percent={Math.round((v.exportInfo.currentFrame / v.exportInfo.totalFrames) * 100)}
          trailColor="var(--section)"
          status={v.exportInfo.cancelRequested ? 'exception' : 'normal'}
        />
      )}
      {v.exportInfo.exporting && v.exportInfo.cancelRequested && <span>{$t('Canceling...')}</span>}
      {v.exportInfo.exporting && <br />}
      {v.exportInfo.exporting && (
        <button
          className="button button--soft-warning"
          onClick={() => {
            HighlighterService.actions.cancelExport();
          }}
          style={{ marginTop: '16px' }}
          disabled={v.exportInfo.cancelRequested}
        >
          {$t('Cancel')}
        </button>
      )}
      {!v.exportInfo.exporting && v.exportInfo.error && (
        <Alert style={{ marginBottom: 24 }} message={v.exportInfo.error} type="error" showIcon />
      )}
      {!v.exportInfo.exporting &&
        !v.exportInfo.cancelRequested &&
        !v.exportInfo.error &&
        didStartExport.current && (
          <video
            style={{ outline: 'none', width: '100%' }}
            src={HighlighterService.views.getCacheBustingUrl(v.exportInfo.previewFile)}
            controls
            autoPlay
          />
        )}
    </div>
  );
}
