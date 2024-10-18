import React from 'react';
import { useGoLiveSettings } from '../useGoLiveSettings';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';
import { NonUltraDestinationSwitchers } from './NonUltraDestinationSwitchers';
export default function UserSettingsNonUltra() {
  const { canAddDestinations, isLoading } = useGoLiveSettings().extend(module => {
    return {
      // non-ultra users can stream to a combined two platforms/destinations
      get canAddDestinations() {
        const numCustomDestinations = module.state.customDestinations.filter(
          destination => destination.enabled,
        ).length;
        const numEnabledPlatforms = module.state.enabledPlatforms.length;

        return numCustomDestinations + numEnabledPlatforms < 2;
      },
    };
  });

  return (
    <>
      {/*DESTINATION SWITCHERS*/}
      {!isLoading && <NonUltraDestinationSwitchers showSelector={canAddDestinations} />}
      {/*ADD DESTINATION BUTTON*/}
      {!isLoading && !canAddDestinations && <AddDestinationButton data-test="add-dest-btn" />}
    </>
  );
}
