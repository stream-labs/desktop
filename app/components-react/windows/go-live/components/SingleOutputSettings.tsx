import React from 'react';
import { Services } from 'components-react/service-provider';
import { useGoLiveSettings } from '../useGoLiveSettings';
import styles from '../GoLive.m.less';
import Scrollable from 'components-react/shared/Scrollable';
import DualOutputToggle from 'components-react/shared/DualOutputToggle';
import AddDestinationButton from 'components-react/shared/AddDestinationButton';
import { DestinationSwitchers } from '../DestinationSwitchers';
import cx from 'classnames';

export function SingleOutputSettings() {
  const {
    isPrime,
    showSelector,
    canAddDestinations,
    shouldShowUltraButton,
  } = useGoLiveSettings().extend(module => {
    const { SettingsService } = Services;
    return {
      get showSelector() {
        return !module.isPrime && !module.isDualOutputMode && !module.isPlatformLinked('tiktok');
      },

      get canAddDestinations() {
        const linkedPlatforms = module.state.linkedPlatforms;
        const customDestinations = module.state.customDestinations;
        return linkedPlatforms.length + customDestinations.length < 8;
      },

      get shouldShowUltraButton() {
        // never show for ultra accounts
        if (module.isPrime) return false;
        // always show for non-ultra single output mode
        const nonUltraSingleOutput = !module.isDualOutputMode;

        // only show in dual output mode when 2 targets are enabled
        const enabledPlatforms = module.state.enabledPlatforms;
        const enabledCustomDestinations = module.state.enabledCustomDestinations;
        const numTargets = enabledPlatforms.length + enabledCustomDestinations.length;
        const nonUltraDualOutputMaxTargets = numTargets > 1;

        return nonUltraSingleOutput || (nonUltraDualOutputMaxTargets && module.isDualOutputMode);
      },

      addDestination() {
        SettingsService.actions.showSettings('Stream');
      },
    };
  });

  const shouldShowAddDestButton = isPrime ? canAddDestinations : shouldShowUltraButton;
  // return this.canAddDestinations && module.isPrime;

  return (
    <Scrollable style={{ height: '81%' }} snapToWindowEdge>
      <DualOutputToggle
        className={cx(styles.dualOutputToggle, styles.columnPadding)}
        type="single"
        lightShadow
      />
      {/*DESTINATION SWITCHERS*/}
      <DestinationSwitchers showSelector={showSelector} />

      {/*ADD DESTINATION BUTTON*/}
      {shouldShowAddDestButton && <AddDestinationButton data-type="add-dest-btn" />}
    </Scrollable>
  );
}
