import React, { useEffect, useState } from 'react';
import sampleSize from 'lodash/sampleSize';
import { Button } from 'antd';
import { $t } from '../../../services/i18n';
import styles from './Grow.m.less';
import { useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import { IGoal, IUniversityProgress } from '../../../services/grow/grow';
import Util from '../../../services/utils';
import Scrollable from 'components-react/shared/Scrollable';
import { GoalCard, PlatformCard, UniversityCard, ContentHubCard } from './Cards';

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
        <ContentHubCard />
      </div>
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
