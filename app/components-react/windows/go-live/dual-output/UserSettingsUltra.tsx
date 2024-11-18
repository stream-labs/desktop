import React from 'react';
import { useGoLiveSettings } from '../useGoLiveSettings';
import { UltraDestinationSwitchers } from './UltraDestinationSwitchers';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';

export default function UserSettingsUltra() {
  const { canAddDestinations } = useGoLiveSettings().extend(module => {
    return {
      get canAddDestinations() {
        const linkedPlatforms = module.state.linkedPlatforms;
        const customDestinations = module.state.customDestinations;
        return linkedPlatforms.length + customDestinations.length < 5;
      },
    };
  });

  const shouldShowAddDestButton = canAddDestinations;
  return (
    <>
      {/*DESTINATION SWITCHERS*/}
      <UltraDestinationSwitchers />
      {/*ADD DESTINATION BUTTON*/}
      {shouldShowAddDestButton && <AddDestinationButton data-type="add-dest-btn" />}
    </>
  );
}
