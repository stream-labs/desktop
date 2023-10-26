import React, { useMemo } from 'react';
import { Button } from 'antd';
import { shell } from '@electron/remote';
import { OnboardingModule } from './Onboarding';
import { useModule } from 'slap';
import { StreamerKnowledgeMode } from 'services/onboarding';
import { $t } from 'services/i18n';
import Translate from 'components-react/shared/Translate';
import commonStyles from './Common.m.less';
import styles from './Tips.m.less';

const openExternalLink: React.MouseEventHandler<HTMLAnchorElement> = evt => {
  evt.preventDefault();
  shell.openExternal(evt.currentTarget.href);
};

const dashboardUrl = 'https://streamlabs.com/dashboard';
const linkProps = { slot: 'link', onClick: openExternalLink };

function AllStarsTip() {
  return (
    <li>
      <i className="icon-earnings" />
      <Translate
        message={$t(
          'Earn rewards by streaming. Check your All Stars rank <link>in your dashboard</link>',
        )}
      >
        <a href={dashboardUrl} {...linkProps} />
      </Translate>
    </li>
  );
}

function BeginnerTips() {
  return (
    <>
      <li>
        <i className="icon-desktop" />
        <Translate
          message={$t('Set yourself up for success with our <link>getting started guide</link>')}
        >
          <a
            href="https://streamlabs.com/content-hub/post/getting-started-with-streamlabs-desktop"
            {...linkProps}
          />
        </Translate>
      </li>
      <li>
        <i className="icon-disconnected" />
        <Translate message={$t('Prevent crashes with <link>this troubleshooting guide</link>')}>
          <a
            href="https://streamlabs.com/content-hub/post/streamlabs-desktop-crash-troubleshooting-guide"
            {...linkProps}
          />
        </Translate>
      </li>
      <AllStarsTip />
      <li>
        <i className="icon-education" />
        <Translate
          message={$t(
            'Learn more about streaming through our free <link>Streamer University</link>',
          )}
        >
          <a
            href="https://streamlabs.com/content-hub/university/streamer-university"
            {...linkProps}
          />
        </Translate>
      </li>
    </>
  );
}

function IntermediateTips() {
  return (
    <>
      <li>
        <i className="icon-widgets" />
        <Translate
          message={$t('Set up your alerts and widgets on <link>Streamlabs Dashboard</link>')}
        >
          <a href={dashboardUrl} {...linkProps} />
        </Translate>
      </li>
      <AllStarsTip />
      <li>
        <i className="icon-settings" />
        <Translate
          message={$t(
            'Need further assistance? Check out our <link>Creator resource hub</link> for everything you need',
          )}
        >
          <a href="https://streamlabs.com/content-hub/streamlabs-desktop" {...linkProps} />
        </Translate>
      </li>
    </>
  );
}

export function Tips() {
  const { streamerKnowledgeMode, next } = useModule(OnboardingModule);

  const title =
    streamerKnowledgeMode === StreamerKnowledgeMode.BEGINNER
      ? $t('Tips to run your first stream like Pro:')
      : $t('Tips to get the most out of your experience:');

  const tips = useMemo(() => {
    if (streamerKnowledgeMode === StreamerKnowledgeMode.BEGINNER) {
      return <BeginnerTips />;
    } else if (streamerKnowledgeMode === StreamerKnowledgeMode.INTERMEDIATE) {
      return <IntermediateTips />;
    } else {
      // Should never be called as step has a cond filter thus this component will never be rendered
      throw new Error('Unknown streamer knowledge mode');
    }
  }, [streamerKnowledgeMode]);

  return (
    <div className={styles.container}>
      <div className={commonStyles.titleContainer}>{title}</div>

      <ul>{tips}</ul>

      <Button type="primary" shape="round" size="large" onClick={() => next()}>
        {$t('Get Started')}
      </Button>
    </div>
  );
}
