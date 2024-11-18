import React, { CSSProperties } from 'react';
import { $t } from 'services/i18n';
import { useVuex } from 'components-react/hooks';
import { Services } from 'components-react/service-provider';
import { RadioInput } from './inputs';
import { TDisplayType } from 'services/settings-v2';
import { TPlatform, platformLabels } from 'services/platforms';
import { useGoLiveSettings } from 'components-react/windows/go-live/useGoLiveSettings';
import { ICustomStreamDestination } from 'services/settings/streaming';

interface IDisplaySelectorProps {
  title: string;
  index: number;
  platform: TPlatform | null;
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

  const setting = p.platform ? v.platformSettings[p.platform] : customDestinations[p.index];
  const label = p.platform
    ? platformLabels(p.platform)
    : (setting as ICustomStreamDestination).name;

  const displays = [
    {
      label: $t('Horizontal'),
      value: 'horizontal',
    },
    {
      label: $t('Vertical'),
      value: 'vertical',
    },
  ];

  return (
    <RadioInput
      data-test="display-input"
      className={p?.className}
      style={p?.style}
      label={label}
      direction="horizontal"
      nolabel={p?.nolabel ?? undefined}
      nomargin={p?.nomargin ?? undefined}
      defaultValue="horizontal"
      options={displays}
      onChange={(val: TDisplayType) =>
        p.platform
          ? v.updatePlatformSetting(p.platform, val)
          : updateCustomDestinationDisplay(p.index, val)
      }
      value={setting?.display ?? 'horizontal'}
      disabled={v.isMidstreamMode}
    />
  );
}
