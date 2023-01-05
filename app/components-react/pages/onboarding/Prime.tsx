import { useModule } from 'slap';
import React from 'react';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import { OnboardingModule } from './Onboarding';
import { Services } from 'components-react/service-provider';
import { useWatchVuex } from 'components-react/hooks';
import { UltraComparison } from 'components-react/shared/UltraComparison';

export function Prime() {
  const { UserService } = Services;
  const { next } = useModule(OnboardingModule);

  useWatchVuex(
    () => UserService.views.isPrime,
    isPrime => isPrime && next(),
  );

  return (
    <div style={{ width: '100%' }}>
      <h1 className={commonStyles.titleContainer}>{$t('Choose your Streamlabs plan')}</h1>
      <UltraComparison onSkip={next} refl="slobs-onboarding" />
    </div>
  );
}
