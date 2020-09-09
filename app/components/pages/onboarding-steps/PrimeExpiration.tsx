import { remote } from 'electron';
import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import styles from './Prime.m.less';
import { Inject } from 'services/core';
import { OnboardingStepProps } from '../Onboarding';
import { UsageStatisticsService } from 'services/usage-statistics';
import { MagicLinkService } from 'services/magic-link';
import { NavigationService } from 'services/navigation';

@Component({ props: createProps(OnboardingStepProps) })
export default class PrimeExpiration extends TsxComponent<OnboardingStepProps> {
  @Inject() private usageStatisticsService: UsageStatisticsService;
  @Inject() private magicLinkService: MagicLinkService;
  @Inject() private navigationService: NavigationService;

  async handlePrimeResubscribe() {
    this.usageStatisticsService.recordClick('PrimeExpiration', 'resubscribe-button');
    try {
      const link = await this.magicLinkService.getDashboardMagicLink('prime', 'slobs_themes_resub');
      remote.shell.openExternal(link);
      this.navigationService.navigate('Studio');
    } catch (e) {
      console.error('Error generating dashboard magic link', e);
    }
  }

  leavePage() {
    this.usageStatisticsService.recordClick('PrimeExpiration', 'skip-resubscribe');
    this.navigationService.navigate('Studio');
  }

  render() {
    return (
      <div class={styles.expirationContainer}>
        <img src="https://slobs-cdn.streamlabs.com/media/prime-unsubscribe.png" />
        <h1 class={commonStyles.titleContainer}>
          {$t('Your access to Prime themes and other benefits will expire soon')}
        </h1>
        <p>
          {$t(
            'Thank you for being a valued member of Streamlabs. We just wanted to check in and see if you’d like to give Prime another shot.',
          )}
        </p>

        <div
          class={commonStyles.optionCard}
          style="background: var(--prime);"
          onClick={() => this.handlePrimeResubscribe()}
        >
          <h2>{$t('Resubscribe to Prime')}</h2>
        </div>
        <a onClick={() => this.leavePage()} style="text-decoration: underline; margin-top: 16px;">
          {$t('No Thanks')}
        </a>
      </div>
    );
  }
}
