import { Component } from 'vue-property-decorator';
import TsxComponent, { createProps } from 'components/tsx-component';
import { $t } from 'services/i18n';
import commonStyles from './Common.m.less';
import styles from './Prime.m.less';
import { OnboardingStepProps } from '../Onboarding';
import Translate from 'components/shared/translate';

@Component({ props: createProps(OnboardingStepProps) })
export default class Prime extends TsxComponent<OnboardingStepProps> {
  get primeMetadata() {
    return [
      {
        title: $t('Overlay, Widget & Site Themes'),
        img: require('../../../../media/images/onboarding/prime/themes.png'),
      },
      {
        title: $t('Custom Domain + Website'),
        img: require('../../../../media/images/onboarding/prime/website.png'),
      },
      {
        title: $t('More Than 40 FREE Apps'),
        img: require('../../../../media/images/onboarding/prime/appstore.png'),
      },
      {
        title: $t('Custom Merch Store'),
        img: require('../../../../media/images/onboarding/prime/merch.png'),
      },
      {
        title: $t('Stream on Mobile'),
        img: require('../../../../media/images/onboarding/prime/mobile.png'),
      },
      {
        title: $t('Gold Status + FREE T-shirt'),
        img: require('../../../../media/images/onboarding/prime/loyalty.png'),
      },
    ];
  }

  get scopedSlots() {
    return {
      primeTitle: (text: string) => <h1 class={styles.primeTitle}>{text}</h1>,
    };
  }

  render() {
    return (
      <div style="width: 100%;">
        <h1 class={commonStyles.titleContainer}>
          <Translate message={$t('primeTitle')} scopedSlots={this.scopedSlots} />
        </h1>
        <div class={styles.primeCardContainer}>
          {this.primeMetadata.map(data => (
            <div class={styles.primeCard}>
              <h2>{data.title}</h2>
              <img src={data.img} />
            </div>
          ))}
        </div>
      </div>
    );
  }
}
