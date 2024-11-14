import React from 'react';
import Scrollable from 'components-react/shared/Scrollable';
import UserSettingsUltra from '../dual-output/UserSettingsUltra';
import UserSettingsNonUltra from '../dual-output/UserSettingsNonUltra';
import { useGoLiveSettings } from '../useGoLiveSettings';

export function DualOutputSettings() {
  const { isPrime, height } = useGoLiveSettings().extend(module => {
    return {
      get height() {
        const shouldShowPrimaryChatSwitcher = module.isDualOutputMode
          ? module.isRestreamEnabled && module.hasMultiplePlatforms
          : module.hasMultiplePlatforms;

        return shouldShowPrimaryChatSwitcher ? '81%' : '100%';
      },
    };
  });

  return (
    <Scrollable style={{ height }}>
      {isPrime && <UserSettingsUltra />}
      {!isPrime && <UserSettingsNonUltra />}
    </Scrollable>
  );
}
