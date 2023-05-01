import React from 'react';
import { useGoLiveSettings } from '../useGoLiveSettings';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';
import DualOutputPlatformSelector from './DualOutputPlatformSelector';
import { DualOutputDestinationSwitchers } from './DualOutputDestinationSwitchers';
export default function UserSettingsNonUltra() {
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
      <DualOutputDestinationSwitchers />
      {/*ADD DESTINATION BUTTON OR DROPDOWN*/}
      {shouldShowAddDestButton && <AddDestinationButton />}
      {!shouldShowAddDestButton && <DualOutputPlatformSelector />}
    </>
  );
}
