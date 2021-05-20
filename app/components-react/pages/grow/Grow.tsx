import React, { useEffect, useState } from 'react';
import sampleSize from 'lodash/sampleSize';
import { Button, Modal, Form } from 'antd';
import { $t } from '../../../services/i18n';
import styles from './Grow.m.less';
import { useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import { IGoal, IUniversityProgress, ICommunityReach } from '../../../services/grow/grow';
import Util from '../../../services/utils';
import Scrollable from 'components-react/shared/Scrollable';
import { GoalCard, PlatformCard, UniversityCard, ContentHubCard, MultistreamCard } from './Cards';
import { TextInput, NumberInput } from 'components-react/shared/inputs';

export default function Grow() {
  const { GrowService } = Services;

  const [universityProgress, setUniversityProgress] = useState({} as IUniversityProgress);
  const [platforms, setPlatforms] = useState([] as ICommunityReach[]);

  const v = useVuex(() => ({
    goals: GrowService.views.goals,
  }));

  useEffect(getUniversityProgress, []);
  useEffect(getPlatformFollowers, []);

  function getUniversityProgress() {
    GrowService.actions.return.fetchUniversityProgress().then(progress => {
      if (!progress) return;
      setUniversityProgress(progress);
    });
  }

  function getPlatformFollowers() {
    GrowService.actions.return.fetchPlatformFollowers().then(communityReach => {
      const platformsToMap = communityReach.concat(
        GrowService.views.platformOptions.filter(p => !communityReach.find(r => r.icon === p.icon)),
      );

      setPlatforms(platformsToMap);
    });
  }

  return (
    <div className={styles.goalTabContainer}>
      <div className={styles.goalTabContent}>
        <MyGoals goals={v.goals} />
        <MyCommunity platforms={platforms} />
        <ResourceFooter universityProgress={universityProgress} />
      </div>
      <GrowthTips tips={GrowService.views.tips} />
    </div>
  );
}

function MyGoals(p: { goals: Dictionary<IGoal> }) {
  const { GrowService } = Services;
  const [s, setState] = useState({
    showGoalModal: false,
    goalTitle: '',
    goalTotal: 10,
  });
  const mappedGoals = Object.values(p.goals);
  const appendedOptions = sampleSize(
    GrowService.views.goalOptions.filter(goal => !p.goals[goal.id]),
    4 - mappedGoals.length,
  );

  function showGoalModal() {
    setState({ ...s, showGoalModal: true });
  }

  function hideGoalModal() {
    setState({ ...s, showGoalModal: false });
  }

  function setGoalTitle(val: string) {
    setState({ ...s, goalTitle: val });
  }

  function setGoalTotal(val: number) {
    setState({ ...s, goalTotal: val });
  }

  function addGoal() {
    GrowService.actions.addGoal({ title: s.goalTitle, total: s.goalTotal, id: '', image: '' });
    setState({ ...s, showGoalModal: false, goalTitle: '', goalTotal: 10 });
  }

  return (
    <div className={styles.myGoals}>
      <h2>{$t('My Goals')}</h2>

      <div className={styles.goalsContainer}>
        {mappedGoals.map(goal => (
          <GoalCard goal={goal} key={goal.id} />
        ))}
        {appendedOptions.map(goal => (
          <GoalCard goal={goal} key={goal.id} showGoalModal={showGoalModal} />
        ))}
      </div>
      <Modal
        visible={s.showGoalModal}
        getContainer={`.${styles.goalTabContainer}`}
        onOk={addGoal}
        onCancel={hideGoalModal}
        title={$t('Add Goal')}
      >
        <Form>
          <TextInput
            label={$t('Goal Title')}
            value={s.goalTitle}
            onChange={setGoalTitle}
            uncontrolled={false}
          />
          <NumberInput
            label={$t('Goal Total')}
            value={s.goalTotal}
            min={0}
            onChange={setGoalTotal}
          />
        </Form>
      </Modal>
    </div>
  );
}

function MyCommunity(p: { platforms: ICommunityReach[] }) {
  const { UserService } = Services;
  const totalFollowing = p.platforms
    .filter(Util.propertyExists('followers'))
    .reduce((count, current) => count + current.followers, 0);

  const reachableFollowing = UserService.views.isPrime
    ? totalFollowing
    : p.platforms.filter(Util.propertyExists('followers'))[0].followers;

  return (
    <div className={styles.myCommunity}>
      <h2>
        {$t('Community Reach: %{reachableFollowing}/%{totalFollowing} followers', {
          reachableFollowing,
          totalFollowing,
        })}
      </h2>
      <span>
        {$t('You can reach %{percentage}% of your community across all platforms', {
          percentage: Math.floor((reachableFollowing / totalFollowing) * 100),
        })}
      </span>

      <div className={styles.communityContainer}>
        {p.platforms.map(platform => (
          <PlatformCard platform={platform} key={platform.icon} />
        ))}
        {(!UserService.views.isPrime || true) && <MultistreamCard />}
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
