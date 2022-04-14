import { Tooltip } from 'antd';
import { useModule } from 'components-react/hooks/useModule';
import KevinSvg from 'components-react/shared/KevinSvg';
import React from 'react';
import { $t } from 'services/i18n';
import { $i } from 'services/utils';
import styles from './ChooseYourAdventure.m.less';
import commonStyles from './Common.m.less';
import ObsSvg from './ObsSvg';
import { OnboardingModule } from './Onboarding';

export function FreshOrImport() {
  const { setImportFromObs, next } = useModule(OnboardingModule).select();

  const optionsMetadata = [
    {
      title: $t('Import from OBS Studio'),
      color: '--blue',
      description: $t(
        'We import all of your settings, including scenes, output, configurations, and much more',
      ),
      image: <ObsSvg />,
      onClick: () => {
        setImportFromObs();
        next();
      },
    },
    {
      title: $t('Start Fresh'),
      color: '--teal',
      description: $t(
        'Start with a clean copy of Streamlabs Desktop and configure your settings from scratch',
      ),
      image: <KevinSvg />,
      onClick: next,
    },
  ];

  return (
    <div>
      <div className={styles.footer}>
        <SvgBackground />
        <img src={$i('images/onboarding/splash.png')} />
      </div>
      <h1 className={styles.title}>{$t('Welcome to Streamlabs')}</h1>
      <div className={styles.optionContainer}>
        {optionsMetadata.map(data => (
          <Tooltip title={data.description} placement="bottom" key={data.title}>
            <div
              className={commonStyles.optionCard}
              onClick={() => data.onClick()}
              style={{ background: `var(${data.color})` }}
            >
              <h2>{data.title}</h2>
              {data.image}
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

const SvgBackground = () => (
  <svg width="100%" height="100%" viewBox="0 0 1083 720" xmlns="http://www.w3.org/2000/svg">
    <path d="M918.999 140.5C971.667 9.75951 1187.91 -68.6629 1230.5 -54.9996L1253.58 124.762L1253.58 819.511L-0.000563148 726C81.0237 473.471 374.649 724.719 519 457C604.999 297.5 776.499 494.238 918.999 140.5Z" />
  </svg>
);
