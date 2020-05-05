import { Component } from 'vue-property-decorator';
import { OnboardingStep } from 'streamlabs-beaker';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { OnboardingService } from 'services/onboarding';
import styles from './ObsImport.m.less';
import KevinSvg from 'components/shared/KevinSvg';
import ObsSvg from './ObsSvg';
import { OnboardingStepProps } from '../Onboarding';

@Component({ props: createProps(OnboardingStepProps) })
export default class ChooseYourAdventure extends TsxComponent<OnboardingStepProps> {
  @Inject() onboardingService: OnboardingService;

  get optionsMetadata() {
    return [
      {
        title: $t('Import from OBS'),
        time: `< 1 ${$t('min')}`,
        timeColor: '--blue',
        description: $t(
          'We import all of your settings, including scenes, output, configurations, and much more',
        ),
        image: <ObsSvg />,
        onClick: this.importFromObs,
      },
      {
        title: $t('Start Fresh'),
        time: `~2 ${$t('min')}`,
        timeColor: '--teal',
        description: $t(
          'Start with a clean copy of Streamlabs OBS and configure your settings from scratch',
        ),
        image: <KevinSvg />,
        onClick: this.props.continue,
      },
    ];
  }

  importFromObs() {
    this.onboardingService.setObsImport(true);
    this.props.continue();
  }

  render() {
    return (
      <OnboardingStep slot="2">
        <template slot="title">{$t('Welcome to Streamlabs OBS')}</template>
        <template slot="desc">
          {$t('Import your existing settings from OBS in less than a minute and go live')}
        </template>
        <div style="display: flex; justify-content: space-between;">
          {this.optionsMetadata.map(data => (
            <div class={styles.optionCard} onClick={() => data.onClick()}>
              <span
                class={`${styles.badge} ${styles.timeBadge}`}
                style={{ background: `var(${data.timeColor})`, color: 'white' }}
              >
                {data.time}
              </span>
              <h2>{data.title}</h2>
              <span>{data.description}</span>
              {data.image}
            </div>
          ))}
        </div>
      </OnboardingStep>
    );
  }
}
