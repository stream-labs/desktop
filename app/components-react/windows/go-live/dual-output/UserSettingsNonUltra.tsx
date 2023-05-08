import React from 'react';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from '../useGoLiveSettings';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';
import DualOutputPlatformSelector from './DualOutputPlatformSelector';
import { NonUltraDestinationSwitchers } from './NonUltraDestinationSwitchers';

export default function UserSettingsNonUltra() {
  const { canAddDestinations } = useGoLiveSettings().extend(module => {
    const { StreamingService } = Services;

    return {
      // non-ultra users can stream to a combined two platforms/destinations
      get canAddDestinations() {
        const numCustomDestinations = module.state.customDestinations.filter(
          destination => destination.enabled,
        ).length;
        const numEnabledPlatforms = StreamingService.views.enabledPlatforms.length;

        return numCustomDestinations + numEnabledPlatforms < 2;
      },
    };
  });

  return (
    <>
      {/*DESTINATION SWITCHERS*/}
      <NonUltraDestinationSwitchers showSelector={canAddDestinations} />
      {/*ADD DESTINATION BUTTON*/}
      {!canAddDestinations && <AddDestinationButton />}
    </>
  );
}
