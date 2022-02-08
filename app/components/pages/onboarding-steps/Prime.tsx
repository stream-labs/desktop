import cx from 'classnames';
import electron from 'electron';
import { Component, Watch } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import styles from './Prime.m.less';
import { OnboardingStepProps } from '../Onboarding';
import { Inject } from 'services/core/injector';
import { MagicLinkService } from 'services/magic-link';
import { UserService } from 'services/user';

@Component({ props: createProps(OnboardingStepProps) })
export default class Prime extends TsxComponent<OnboardingStepProps> {
  @Inject() magicLinkService: MagicLinkService;
  @Inject() userService: UserService;

  get isPrime() {
    return this.userService.views.isPrime;
  }

  @Watch('isPrime')
  navigate() {
    this.props.continue();
  }

  get primeMetadata() {
    return {
      standard: [
        { text: $t('Go live to one platform'), icon: 'icon-broadcast' },
        { text: $t('Tipping (no Streamlabs fee)'), icon: 'icon-balance' },
        { text: $t('Alerts & other Widgets'), icon: 'icon-widgets' },
        { text: $t('Recording'), icon: 'icon-record' },
        { text: $t('Selective Recording'), icon: 'icon-smart-record' },
        { text: $t('Game Overlay'), icon: 'icon-editor-7' },
        { text: $t('And many more free features'), icon: 'icon-more' },
      ],
      prime: [
        { text: $t('All free features'), icon: 'icon-streamlabs' },
        { text: $t('Multistream to multiple platforms'), icon: 'icon-multistream' },
        { text: $t('Premium Stream Overlays'), icon: 'icon-design' },
        { text: $t('Alert Box and Widget Themes'), icon: 'icon-themes' },
        { text: $t('Access to all App Store Apps'), icon: 'icon-store' },
        { text: $t('Prime Mobile Streaming'), icon: 'icon-phone' },
        { text: $t('Prime Web Suite'), icon: 'icon-desktop' },
      ],
    };
  }

  linkToPrime() {
    this.magicLinkService.linkToPrime('slobs-onboarding');
  }

  render() {
    return (
      <div style="width: 100%;">
        <h1 class={commonStyles.titleContainer}>{$t('Choose your Streamlabs plan')}</h1>
        <div style="display: flex; align-items: center; justify-content: center;">
          <div class={styles.cardContainer} onClick={() => this.props.continue()}>
            <h1>
              <i class="icon-streamlabs" />
              {$t('Free')}
            </h1>
            <span style="margin-bottom: 8px">
              {$t('Everything you need to go live. Always and forever free.')}
            </span>
            {this.primeMetadata.standard.map(data => (
              <div class={styles.primeRow}>
                <i class={data.icon} />
                <span>{data.text}</span>
              </div>
            ))}
            <div class={cx(styles.primeButton, styles.freeButton)}>{$t('Choose Free')}</div>
          </div>
          <div
            class={cx(styles.cardContainer, styles.primeCardContainer)}
            onClick={() => this.linkToPrime()}
          >
            <h1>
              <i class="icon-prime" />
              {$t('Prime')}
            </h1>
            <span style="margin-bottom: 8px">
              {$t('Pro features to take your stream and channel to the next level.')}
            </span>
            {this.primeMetadata.prime.map(data => (
              <div class={styles.primeRow}>
                <i class={data.icon} />
                <span>{data.text}</span>
              </div>
            ))}
            <div class={styles.primeButton}>{$t('Choose Prime')}</div>
          </div>
        </div>
      </div>
    );
  }
}
