import React, { CSSProperties, useMemo } from 'react';
import { $t } from 'services/i18n';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { RadioInput } from './inputs';
import { displayLabels } from 'services/dual-output';
import { TDisplayType } from 'services/settings-v2';
import { platformLabels } from 'services/platforms';
import { useGoLiveSettings } from 'components-react/windows/go-live/useGoLiveSettings';

interface IDisplaySelectorProps {
  title: string;
  index: number;
  isPlatform: boolean;
  nolabel?: boolean;
  nomargin?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function DisplaySelector(p: IDisplaySelectorProps) {
  const { DualOutputService, StreamingService } = Services;

  const { customDestinations, updateCustomDestinationDisplay } = useGoLiveSettings();

  const v = useVuex(() => ({
    updatePlatformSetting: DualOutputService.actions.updatePlatformSetting,
    platformSettings: DualOutputService.views.platformSettings,
    isMidstreamMode: StreamingService.views.isMidStreamMode,
  }));

  const platform = p.title.toLowerCase();
  const setting = p.isPlatform ? v.platformSettings[platform] : customDestinations[p.index];
  const label = p.isPlatform ? platformLabels(platform) : setting.name;

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
      className={p?.className}
      style={p?.style}
      label={label}
      direction="horizontal"
      nolabel={p?.nolabel ?? undefined}
      nomargin={p?.nomargin ?? undefined}
      defaultValue="horizontal"
      options={displays}
      onChange={(val: TDisplayType) =>
        p.isPlatform
          ? v.updatePlatformSetting(platform, val)
          : updateCustomDestinationDisplay(p.index, val)
      }
      value={setting?.display ?? 'horizontal'}
      disabled={v.isMidstreamMode}
    />
  );
}
