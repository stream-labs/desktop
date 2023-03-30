import React, { useEffect } from 'react';
import path from 'path';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { $t } from 'services/i18n';

export default function CrossClipUpload(p: { onClose: () => void }) {
  const { UserService, HighlighterService, NavigationService, UsageStatisticsService } = Services;

  const v = useVuex(() => ({
    uploadInfo: HighlighterService.views.uploadInfo,
    exportInfo: HighlighterService.views.exportInfo,
  }));
  const filename = path.parse(v.exportInfo.file).base;

  // Clear all errors when this component unmounts
  useEffect(() => {
    return () => HighlighterService.actions.dismissError();
  }, []);

  return <button>{$t('Upload')}</button>;
}
