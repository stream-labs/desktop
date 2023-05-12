import React, { CSSProperties } from 'react';
import { $t } from 'services/i18n';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { RadioInput } from './inputs';
import { displayLabels } from 'services/dual-output';
import { TDisplayType } from 'services/settings-v2';
import { EPlatform, TPlatform, platformLabels, platformList } from 'services/platforms';

interface IDisplaySelectorProps {
  name: TPlatform | string;
  nolabel?: boolean;
  nomargin?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function DisplaySelector(p: IDisplaySelectorProps) {
  const { DualOutputService, StreamingService } = Services;

  const isPlatform = platformList.includes(p.name as EPlatform);

  const v = useVuex(() => ({
    updateDisplay: isPlatform
      ? DualOutputService.actions.updatePlatformSetting
      : DualOutputService.actions.updateDestinationSetting,
    setting: isPlatform
      ? DualOutputService.views.platformSettings[p.name]
      : DualOutputService.views.destinationSettings[p.name],
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

  const label = isPlatform ? platformLabels(p.name) : p.name;

  return (
    <RadioInput
      className={p.className}
      style={p.style}
      label={label}
      direction="horizontal"
      nolabel={p.nolabel ?? undefined}
      nomargin={p.nomargin ?? undefined}
      defaultValue="horizontal"
      options={displays}
      onChange={val => v.updateDisplay(p.name, val as TDisplayType)}
      value={v.setting?.display ?? 'horizontal'}
      disabled={v.isMidstreamMode || !v.setting?.canUpdate}
    />
  );
}
