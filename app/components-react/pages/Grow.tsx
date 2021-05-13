import React, { useEffect, useState } from 'react';
import sampleSize from 'lodash/sampleSize';
import cx from 'classnames';
import { Button, Progress } from 'antd';
import { $t } from '../../services/i18n';
import styles from './Grow.m.less';
import { useVuex } from '../hooks';
import { Services } from '../service-provider';
import { IGoal, IUniversityProgress } from '../../services/grow/grow';
import Util from '../../services/utils';
import PlatformLogo from 'components-react/shared/PlatformLogo';
import Scrollable from 'components-react/shared/Scrollable';

export default function Grow() {
  const { GrowService } = Services;

  const [universityProgress, setUniversityProgress] = useState({} as IUniversityProgress);

  const v = useVuex(() => ({
    goals: GrowService.views.goals,
    platforms: GrowService.views.platforms,
    tips: GrowService.views.tips,
  }));

  useEffect(getUniversityProgress, []);

  function getUniversityProgress() {
    GrowService.fetchUniversityProgress().then(progress => {
      if (!progress) return;
      setUniversityProgress(progress);
    });
  }

  return (
    <div className={styles.goalTabContainer}>
      <div className={styles.goalTabContent}>
        <MyGoals goals={v.goals} />
        <MyCommunity platforms={v.platforms} />
        <ResourceFooter universityProgress={universityProgress} />
      </div>
      <GrowthTips tips={v.tips} />
    </div>
  );
}

function MyGoals(p: { goals: Dictionary<IGoal> }) {
  const { GrowService } = Services;
  const mappedGoals = Object.values(p.goals);
  const appendedOptions = sampleSize(GrowService.views.goalOptions, 4 - mappedGoals.length);
  const goalsToMap = mappedGoals.length < 4 ? [...mappedGoals, ...appendedOptions] : mappedGoals;

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

function MyCommunity(p: { platforms: { icon: string; followers?: number }[] }) {
  const totalFollowing = p.platforms
    .filter(Util.propertyExists('followers'))
    .reduce((count, current) => count + current.followers, 0);

  return (
    <div className={styles.myCommunity}>
      <h2>{$t('My Community: %{totalFollowing} followers', { totalFollowing })}</h2>
      <span>{$t('Connect social accounts to track your progress from one place')}</span>

      <div className={styles.communityContainer}>
        {p.platforms.map(platform => (
          <PlatformCard platform={platform} key={platform.icon} />
        ))}
      </div>
    </div>
  );
}

function ResourceFooter(p: { universityProgress: IUniversityProgress }) {
  return (
    <div className={styles.streamerResources}>
      <h2>{$t('Streamer Resources')}</h2>
      <span>{$t('')}</span>

      <div className={styles.resourcesContainer}>
        <UniversityCard progress={p.universityProgress} />
        <div className={styles.card} style={{ minWidth: '580px' }}>
          <div className={styles.cardInner}>
            <h3>{$t('Content Hub')}</h3>
            <span>
              {$t(
                'The Ultimate Resource For Live Streamers; The Content Hub is your one-stop-shop for everything related to live streaming. There are dozens of different categories to choose from. Learn how to set up your live stream, find new features, and stay up-to-date on all of the tools you can use to enhance your stream.',
              )}
            </span>
            <footer>
              <Button>{$t('Open Content Hub')}</Button>
              <Button>{$t('Streamlabs on YouTube')}</Button>
            </footer>
          </div>
          <img src="https://slobs-cdn.streamlabs.com/media/grow/content_hub.png" />
        </div>
      </div>
    </div>
  );
}

function UniversityCard(p: { progress: IUniversityProgress }) {
  let content: React.ReactNode | string = $t(
    'Professional streamers are now able to earn large amounts of money while entertaining people and creating their own brand. But how does one become a professional streamer? Streamlabs University is our answer to this question. In this course, we’ll walk you through everything you need to know to become a successful streamer and turn your passion into a profession.',
  );
  let buttonText = $t('Open Streamlabs University');
  let imageUrl = 'https://slobs-cdn.streamlabs.com/media/grow/streamlabs_university.png';

  if (p.progress.enrolled && p.progress?.total_progress < 100 && p.progress.stopped_at) {
    content = <UniversityProgress progress={p.progress} />;
    buttonText = $t('Continue Learning');
    imageUrl = p.progress.stopped_at.image;
  } else if (p.progress?.total_progress === 100) {
    content = $t('You have completed Streamlabs University!');
  }
  return (
    <div className={styles.card} style={{ minWidth: '580px' }}>
      <div className={styles.cardInner}>
        <h3>{$t('Streamlabs University')}</h3>
        <span>{content}</span>
        <Button>{buttonText}</Button>
      </div>
      <img src={imageUrl} />
    </div>
  );
}

function UniversityProgress(p: { progress: IUniversityProgress }) {
  return (
    <div>
      <span>
        {$t('You cleared %{totalProgress}% of all material. Keep it up!', {
          totalProgress: p.progress.total_progress,
        })}
        <Progress
          percent={p.progress.total_progress}
          showInfo={false}
          style={{ marginRight: '16px' }}
        />
        <h3>{p.progress.stopped_at?.title}</h3>
        <span>{p.progress.stopped_at?.description}</span>
      </span>
    </div>
  );
}

function PlatformCard(p: { platform: any }) {
  const { followers, icon, name } = p.platform;
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
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

function GrowthTips(p: { tips: any[] }) {
  return (
    <div className={styles.growthTipsContainer}>
      <h2>{$t('Growth Tips')}</h2>
      <Scrollable isResizable={false} style={{ height: '100%' }}>
        {p.tips.map(tip => (
          <div className={styles.card} key={tip.title}>
            <i className={tip.icon} />
            <strong>{tip.title}</strong>
            <p>{tip.description}</p>
            <Button>{tip.cta}</Button>
          </div>
        ))}
      </Scrollable>
    </div>
  );
}

const ONE_DAY = 1000 * 60 * 60 * 24;

function GoalCard(p: { goal: IGoal }) {
  const { GrowService } = Services;
  const { title, progress, total, image, id } = p.goal;

  const daysLeft = Math.round(GrowService.timeLeft(p.goal) / ONE_DAY);

  function incrementCustomGoal() {
    GrowService.incrementGoal(p.goal.id, 1);
  }

  function addGoal() {
    GrowService.addGoal(p.goal);
  }

  function removeGoal() {
    GrowService.removeGoal(p.goal);
  }

  const manuallyProgressedGoal =
    image === '' ||
    !['stream_times_per_week', 'stream_hours_per_month', 'multistream_per_week'].includes(
      p.goal.id,
    );

  return (
    <div className={styles.card} key={id}>
      <strong>{title}</strong>
      {daysLeft !== Infinity && (
        <span className={styles.whisper}>{$t('%{daysLeft} days left', { daysLeft })}</span>
      )}
      {progress != null && (
        <Progress
          percent={Math.floor((progress / total) * 100)}
          showInfo={false}
          steps={p.goal.total}
          strokeWidth={16}
        />
      )}
      {progress != null && manuallyProgressedGoal ? (
        <Button onClick={incrementCustomGoal} type="primary">
          {$t('Progress')}
        </Button>
      ) : (
        <img src={image} />
      )}
      {progress == null && <Button onClick={addGoal}>{$t('Add Goal')}</Button>}
      {progress != null && (
        <i onClick={removeGoal} className={cx('icon-close', styles.closeIcon)} />
      )}
    </div>
  );
}
