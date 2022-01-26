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
      this.magicLinkService.linkToPrime('slobs_themes_resub');
      this.navigationService.navigate('Studio');
    } catch (e: unknown) {}
  }

  leavePage() {
    this.usageStatisticsService.recordClick('PrimeExpiration', 'skip-resubscribe');
    this.navigationService.navigate('Studio');
  }

  get tableMetadata() {
    return [
      { text: $t('Stream Overlays'), icon: 'icon-themes' },
      { text: $t('Multistream'), icon: 'icon-multistream' },
      { text: $t('Premium Merch'), icon: 'icon-upperwear' },
      { text: $t('Custom Tip Page'), icon: 'icon-creator-site' },
      { text: $t('Alert Box Themes'), icon: 'icon-prime' },
      { text: $t('All Apps Included Free'), icon: 'icon-store' },
      { text: $t('Thumbnail & Panel Maker'), icon: 'icon-smart-view' },
      { text: $t('Prime Mobile Streaming'), icon: 'icon-broadcast' },
    ];
  }

  render() {
    return (
      <div class={styles.expirationContainer}>
        <img
          style="height: 250px;"
          src="https://slobs-cdn.streamlabs.com/media/prime-unsubscribe-2.png"
        />
        <h1 class={commonStyles.titleContainer}>{$t('Your Benefits Are Expiring Soon')}</h1>
        <p>
          {$t('Your will lose access to the following Prime benefits if you don’t resubscribe:')}
        </p>
        <div class={styles.expirationList}>
          {this.tableMetadata.map(feature => (
            <div class={styles.primeRow}>
              <i class={feature.icon} />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
        <p class={styles.whisper}>
          {$t(
            'Thank you for being a valued member of Streamlabs. We just wanted to check in to see if you’ve had a chance to explore all Prime has to offer.',
          )}
        </p>
        <button
          class="button button--prime"
          style="padding: 8px 16px;"
          onClick={() => this.handlePrimeResubscribe()}
        >
          {$t('Continue Prime')}
        </button>
        <a onClick={() => this.leavePage()} style="text-decoration: underline; margin-top: 16px;">
          {$t('No Thanks')}
        </a>
      </div>
    );
  }
}
