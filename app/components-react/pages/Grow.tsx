import React from 'react';
import sampleSize from 'lodash/sampleSize';
import cx from 'classnames';
import { Button, Progress } from 'antd';
import { $t } from '../../services/i18n';
import styles from './Grow.m.less';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import { IGoal } from '../../services/grow/grow';
import Util from '../../services/utils';
import PlatformLogo from 'components-react/shared/PlatformLogo';

export default function Grow() {
  const { GrowService } = Services;

  const v = useVuex(() => ({
    goals: GrowService.views.goals,
    platforms: GrowService.views.platforms,
  }));

  return (
    <div style={{ background: 'var(--background)' }}>
      <MyGoals goals={v.goals} />
      <MyCommunity platforms={v.platforms} />
      <ResourceFooter />
    </div>
  );
}

function MyGoals(p: { goals: IGoal[] }) {
  const { GrowService } = Services;
  const appendedOptions = sampleSize(GrowService.views.goalOptions, 4 - p.goals.length);
  const goalsToMap = p.goals.length < 4 ? [...p.goals, ...appendedOptions] : p.goals;

  return (
    <div className={styles.myGoals}>
      <h2>{$t('My Goals')}</h2>

      <div className={styles.goalsContainer}>
        {goalsToMap.map(goal => (
          <GoalCard goal={goal} />
        ))}
      </div>
    </div>
  );
}

function MyCommunity(p: { platforms: { followers?: number }[] }) {
  const totalFollowing = p.platforms
    .filter(Util.propertyExists('followers'))
    .reduce((count, current) => count + current.followers, 0);

  return (
    <div className={styles.myCommunity}>
      <h2>{$t('My Community: %{totalFollowing} followers', { totalFollowing })}</h2>
      <span>{$t('Connect social accounts to track your progress from one place')}</span>

      <div className={styles.communityContainer}>
        {p.platforms.map(platform => (
          <PlatformCard platform={platform} />
        ))}
      </div>
    </div>
  );
}

function ResourceFooter() {
  return (
    <div className={styles.streamerResources}>
      <h2>{$t('Streamer Resources')}</h2>
      <span>{$t('')}</span>

      <div className={styles.resourcesContainer}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <h3>{$t('Streamlabs University')}</h3>
            <span>
              {$t(
                'Professional streamers are now able to earn large amounts of money while entertaining people and creating their own brand. But how does one become a professional streamer? Streamlabs University is our answer to this question. In this course, we’ll walk you through everything you need to know to become a successful streamer and turn your passion into a profession.',
              )}
            </span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <h3>{$t('Content Hub')}</h3>
            <span>
              {$t(
                'The Ultimate Resource For Live Streaming. Years of blog posts, guides, and support articles are now in one place. Content Hub is your one-stop-shop for everything related to live streaming. There are dozens of different categories to choose from. Learn how to set up your live stream, find new features, and stay up-to-date on all of the tools you can use to enhance your stream.',
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalCard(p: { goal: IGoal }) {
  const { title, image, total, progress } = p.goal;
  return (
    <div className={styles.card}>
      <span>{title}</span>
      {progress && <Progress percent={Math.floor((progress / total) * 100)} />}
      <img src={image} />
      {!progress && <Button>{$t('Add Goal')}</Button>}
    </div>
  );
}

function PlatformCard(p: { platform: any }) {
  const { followers, icon, name } = p.platform;
  return (
    <div className={styles.card}>
      <div style={{ display: 'flex' }}>
        <PlatformLogo platform={icon} />
        <span className={cx(styles.title, styles[icon])}>{name}</span>
      </div>
      {followers ? (
        <span>{$t('%{followers} followers', { followers })}</span>
      ) : (
        <Button>{$t('Connect')}</Button>
      )}
    </div>
  );
}
