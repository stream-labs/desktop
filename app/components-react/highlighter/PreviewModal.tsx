import { useVuex } from 'components-react/hooks';
import React, { useEffect } from 'react';
import { Services } from 'components-react/service-provider';
import { Progress } from 'antd';

export default function PreviewModal() {
  const { HighlighterService } = Services;
  const v = useVuex(() => ({
    exportInfo: HighlighterService.views.exportInfo,
  }));

  useEffect(() => {
    HighlighterService.export(true);

    return () => HighlighterService.cancelExport();
  }, []);

  return (
    <div>
      <h2>Render Preview</h2>
      <p>
        The render preview shows a low-quality preview of the final rendered video. The final
        exported video will be higher resolution, framerate, and quality.
      </p>
      {v.exportInfo.exporting && (
        <Progress
          percent={Math.round((v.exportInfo.currentFrame / v.exportInfo.totalFrames) * 100)}
          trailColor="var(--section)"
          status={v.exportInfo.cancelRequested ? 'exception' : 'normal'}
        />
      )}
      {!v.exportInfo.exporting && <video src={v.exportInfo.previewFile} controls />}
    </div>
  );
}
