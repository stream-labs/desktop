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
        { text: $t('Go Live to a single platform'), icon: 'icon-desktop' },
        { text: $t('Alerts & Tipping'), icon: 'icon-alert-box' },
      ],
      prime: [
        { text: $t('Unlimited Themes & Overlays'), icon: 'icon-themes' },
        { text: $t('Go Live to one or more platforms'), icon: 'icon-multistream' },
        { text: $t('Custom Tip Page'), icon: 'icon-creator-site' },
        { text: $t('Custom Alerts & Tipping'), icon: 'icon-alert-box' },
        { text: $t('App Store Apps are FREE'), icon: 'icon-store' },
        { text: $t('Premium Merch'), icon: 'icon-upperwear' },
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
        <p style="text-align: center; width: 100%;">
          {$t('Choose Prime to enjoy everything from Starter plus themes and much more.')}
        </p>
        <div style="display: flex; align-items: center; justify-content: center;">
          <div class={styles.cardContainer} onClick={() => this.props.continue()}>
            <h1>{$t('Starter')}</h1>
            <strong>{$t('Free')}</strong>
            {this.primeMetadata.standard.map(data => (
              <div class={styles.primeRow}>
                <i class={data.icon} />
                <span>{data.text}</span>
              </div>
            ))}
            <div class={styles.primeButton}>{$t('Choose Starter')}</div>
          </div>
          <div
            class={cx(styles.cardContainer, styles.primeCardContainer)}
            onClick={() => this.linkToPrime()}
          >
            <h1>
              <i class="icon-prime" />
              {$t('Prime')}
            </h1>
            <strong>{$t('From $12/mo, billed annually')}</strong>
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
