import React from 'react';
import cx from 'classnames';
import { Progress, Button } from 'antd';
import PlatformLogo from '../../shared/PlatformLogo';
import styles from './Grow.m.less';
import { Services } from '../../service-provider';
import { IGoal, IUniversityProgress } from '../../../services/grow/grow';
import { $t } from '../../../services/i18n';

const ONE_DAY = 1000 * 60 * 60 * 24;

export function GoalCard(p: { goal: IGoal }) {
  const { GrowService } = Services;
  const { title, image, id } = p.goal;

  const daysLeft = Math.round(GrowService.views.timeLeft(p.goal) / ONE_DAY);

  function incrementCustomGoal() {
    GrowService.actions.incrementGoal(p.goal.id, 1);
  }

  function addGoal() {
    GrowService.actions.addGoal(p.goal);
  }

  function removeGoal() {
    GrowService.actions.removeGoal(p.goal);
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
      {p.goal.progress != null && (
        <Progress
          percent={Math.floor((p.goal.progress / p.goal.total) * 100)}
          showInfo={false}
          steps={p.goal.total}
          strokeWidth={16}
        />
      )}
      {p.goal.progress != null && manuallyProgressedGoal ? (
        <Button onClick={incrementCustomGoal} type="primary">
          {$t('Progress')}
        </Button>
      ) : (
        <img src={image} />
      )}
      {p.goal.progress == null && <Button onClick={addGoal}>{$t('Add Goal')}</Button>}
      {p.goal.progress != null && (
        <i onClick={removeGoal} className={cx('icon-close', styles.closeIcon)} />
      )}
    </div>
  );
}

export function UniversityCard(p: { progress: IUniversityProgress }) {
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

export function ContentHubCard() {
  return (
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
  );
}

export function PlatformCard(p: { platform: any }) {
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
