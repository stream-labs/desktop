import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import { Inject } from 'services/core/injector';
import { $t } from 'services/i18n';
import { OnboardingService } from 'services/onboarding';
import commonStyles from './Common.m.less';
import styles from './ChooseYourAdventure.m.less';
import KevinSvg from 'components/shared/KevinSvg';
import ObsSvg from './ObsSvg';
import { OnboardingStepProps } from '../Onboarding';
import { $i } from 'services/utils';

@Component({ props: createProps(OnboardingStepProps) })
export default class ChooseYourAdventure extends TsxComponent<OnboardingStepProps> {
  @Inject() onboardingService: OnboardingService;

  get optionsMetadata() {
    return [
      {
        title: $t('Import from OBS Studio'),
        color: '--blue',
        description: $t(
          'We import all of your settings, including scenes, output, configurations, and much more',
        ),
        image: <ObsSvg />,
        onClick: this.importFromObs,
      },
      {
        title: $t('Start Fresh'),
        color: '--teal',
        description: $t(
          'Start with a clean copy of Streamlabs Desktop and configure your settings from scratch',
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
      <div styles="position: relative;">
        <div class={styles.footer}>
          <SvgBackground />
          <img src={$i('images/onboarding/splash.png')} />
        </div>
        <h1 class={styles.title}>{$t('Welcome to Streamlabs')}</h1>
        <div class={styles.optionContainer}>
          {this.optionsMetadata.map(data => (
            <div
              class={commonStyles.optionCard}
              onClick={() => data.onClick()}
              vTooltip={{ content: data.description, placement: 'bottom' }}
              style={{ background: `var(${data.color})` }}
            >
              <h2>{data.title}</h2>
              {data.image}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

const SvgBackground = () => (
  <svg width="100%" height="100%" viewBox="0 0 1083 720" xmlns="http://www.w3.org/2000/svg">
    <path d="M918.999 140.5C971.667 9.75951 1187.91 -68.6629 1230.5 -54.9996L1253.58 124.762L1253.58 819.511L-0.000563148 726C81.0237 473.471 374.649 724.719 519 457C604.999 297.5 776.499 494.238 918.999 140.5Z" />
  </svg>
);
