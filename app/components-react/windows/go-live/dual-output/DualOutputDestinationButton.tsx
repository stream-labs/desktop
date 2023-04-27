import React from 'react';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from '../useGoLiveSettings';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';

export default function DualOutputDestinationButton() {
  const { canAddDestinations } = useGoLiveSettings().extend(module => {
    const { RestreamService, SettingsService, UserService, MagicLinkService } = Services;

    return {
      get canAddDestinations() {
        const linkedPlatforms = module.state.linkedPlatforms;
        const customDestinations = module.state.customDestinations;
        return linkedPlatforms.length + customDestinations.length < 5;
      },

      addDestination() {
        // open the stream settings or prime page
        if (UserService.views.isPrime) {
          SettingsService.actions.showSettings('Stream');
        } else {
          MagicLinkService.linkToPrime('slobs-multistream');
        }
      },

      shouldShowPrimeLabel: !RestreamService.state.grandfathered,
    };
  });

  const shouldShowAddDestButton = canAddDestinations;

  return (
    <>
      {/* {shouldShowAddDestButton &&  */}
      <AddDestinationButton />
      {/* } */}
    </>
  );
}
