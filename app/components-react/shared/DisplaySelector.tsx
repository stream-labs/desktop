import React, { CSSProperties } from 'react';
import { $t } from 'services/i18n';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { RadioInput } from './inputs';
import { displayLabels, TDualOutputDisplayType } from 'services/dual-output';
import { TPlatform, platformLabels } from 'services/platforms';

interface IDisplaySelectorProps {
  platform: TPlatform;
  nolabel?: boolean;
  nomargin?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function DisplaySelector(p: IDisplaySelectorProps) {
  const { DualOutputService, StreamingService } = Services;

  const v = useVuex(() => ({
    updatePlatformSetting: DualOutputService.actions.updatePlatformSetting,
    setting: DualOutputService.views.platformSettings[p.platform],
    isMidstreamMode: StreamingService.views.isMidStreamMode,
  }));

  const displays = [
    {
      label: displayLabels('horizontal') ?? $t('Horizontal'),
      value: 'horizontal',
    },
    {
      label: displayLabels('vertical') ?? $t('Vertical'),
      value: 'vertical',
    },
  ];

  return (
    <RadioInput
      className={p.className}
      style={p.style}
      label={(platformLabels(p.platform) ?? p.platform) as string}
      direction="horizontal"
      nolabel={p.nolabel ?? undefined}
      nomargin={p.nomargin ?? undefined}
      defaultValue="horizontal"
      options={displays}
      onChange={val => v.updatePlatformSetting(p.platform, val as TDualOutputDisplayType)}
      value={v.setting.display}
      disabled={v.isMidstreamMode || !v.setting.canUpdate}
    />
  );
}
