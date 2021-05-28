import { remote } from 'electron';
import React, { useEffect, useState, useRef } from 'react';
import shuffle from 'lodash/shuffle';
import { Button, Modal, Form } from 'antd';
import { $t } from '../../../services/i18n';
import styles from './Grow.m.less';
import { useVuex } from '../../hooks';
import { Services } from '../../service-provider';
import {
  IGoal,
  IUniversityProgress,
  ICommunityReach,
  IDashboardAnalytics,
} from '../../../services/grow/grow';
import Util from '../../../services/utils';
import Scrollable from 'components-react/shared/Scrollable';
import { GoalCard, PlatformCard, UniversityCard, ContentHubCard, MultistreamCard } from './Cards';
import { TextInput, NumberInput, ListInput } from 'components-react/shared/inputs';

export default function Grow() {
  const { GrowService, UserService } = Services;
  const v = useVuex(() => ({
    goals: GrowService.views.goals,
    platformsToMap: GrowService.views.platformsToMap,
    progress: GrowService.views.universityProgress,
    analytics: GrowService.views.analytics,
    isTwitchAuthed: UserService.views.isTwitchAuthed,
  }));

  useEffect(fetchApiData, []);

  function fetchApiData() {
    GrowService.actions.fetchGoals();
    GrowService.actions.fetchAnalytics();
    GrowService.actions.fetchUniversityProgress();
    GrowService.actions.fetchPlatformFollowers();
  }

  return (
    <div className={styles.goalTabContainer}>
      <Scrollable className={styles.goalTabContent}>
        <MyGoals goals={v.goals} />
        <MyCommunity platforms={v.platformsToMap} />
        {v.isTwitchAuthed && <StreamPulse analytics={v.analytics} />}
        <ResourceFooter universityProgress={v.progress} />
      </Scrollable>
      <GrowthTips />
    </div>
  );
}

function MyGoals(p: { goals: Dictionary<IGoal> }) {
  const { GrowService } = Services;
  const [showGoalModal, setShowGoalModal] = useState(false);

  const mappedGoals = Object.values(p.goals);

  const shuffledGoalOptions = useRef(shuffle(GrowService.views.goalOptions));
  const appendedOptions = shuffledGoalOptions.current
    .filter(goal => !p.goals[goal.type])
    .slice(0, 4 - mappedGoals.length);
  return (
    <div className={styles.myGoals}>
      <h2>{$t('My Goals')}</h2>
      <Button onClick={() => setShowGoalModal(true)} className={styles.addGoalButton}>
        {$t('Add Goal')}
      </Button>

      <div className={styles.goalsContainer}>
        {mappedGoals.map(goal => (
          <GoalCard goal={goal} key={goal.type} />
        ))}
        {appendedOptions.map(goal => (
          <GoalCard goal={goal} key={goal.type} showGoalModal={() => setShowGoalModal(true)} />
        ))}
      </div>
      <AddGoalModal visible={showGoalModal} setShowGoalModal={setShowGoalModal} />
    </div>
  );
}

function AddGoalModal(p: { visible: boolean; setShowGoalModal: Function }) {
  const { GrowService } = Services;
  const [goalTotal, setGoalTotal] = useState(10);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState('custom');

  function addGoal() {
    const image = GrowService.views.goalOptions.find(goal => goalType)?.image || '';
    GrowService.actions.addGoal({ title: goalTitle, total: goalTotal, type: goalType, image });
    setGoalTitle('');
    setGoalTotal(10);
    p.setShowGoalModal(false);
  }

  const goalTypes = GrowService.views.goalOptions.map(option => ({
    value: option.type,
    label: option.title,
  }));

  return (
    <Modal
      visible={p.visible}
      getContainer={`.${styles.goalTabContainer}`}
      onOk={addGoal}
      onCancel={() => p.setShowGoalModal(false)}
      title={$t('Add Goal')}
    >
      <Form>
        <ListInput
          label={$t('Goal Type')}
          options={goalTypes}
          value={goalType}
          onChange={setGoalType}
        />
        {goalType === 'custom' && (
          <TextInput
            label={$t('Goal Title')}
            value={goalTitle}
            onChange={setGoalTitle}
            uncontrolled={false}
          />
        )}
        {goalType === 'custom' && (
          <NumberInput label={$t('Goal Total')} value={goalTotal} min={0} onChange={setGoalTotal} />
        )}
      </Form>
    </Modal>
  );
}

function MyCommunity(p: { platforms: ICommunityReach[] }) {
  const { UserService, StreamingService } = Services;
  const totalFollowing = p.platforms
    .filter(Util.propertyExists('followers'))
    .reduce((count, current) => count + current.followers, 0);

  const reachableFollowing = p.platforms
    .filter(Util.propertyExists('followers'))
    .filter(platform => StreamingService.views.checkEnabled(platform.icon))
    .reduce((count, current) => count + current.followers, 0);

  return (
    <div className={styles.myCommunity}>
      <h2>
        {$t('Community Reach: %{reachableFollowing}/%{totalFollowing} followers', {
          reachableFollowing,
          totalFollowing,
        })}
      </h2>
      <span>
        {$t(
          'You can reach %{percentage}% of your community across all platforms. Multistream to more platforms to increase this number',
          {
            percentage: Math.floor((reachableFollowing / totalFollowing) * 100),
          },
        )}
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

const STATS_TO_MAP = () => [
  { title: $t('Average View Time'), value: 'avg_view_times' },
  { title: $t('Unique Viewers'), value: 'viewers' },
  { title: $t('Chatters'), value: 'chatters' },
  { title: $t('Chats'), value: 'chats' },
];

function StreamPulse(p: { analytics: IDashboardAnalytics }) {
  return (
    <div className={styles.streamPulse}>
      <h2>{$t('Stream Pulse')}</h2>
      <div className={styles.streamPulseContainer}>
        {STATS_TO_MAP().map(stat => (
          <div className={styles.card}>
            <span className={styles.title}>{stat.title}</span>
            <span>{p.analytics[stat.value]}</span>
          </div>
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

function GrowthTips() {
  const { MagicLinkService, NavigationService, GrowService } = Services;

  const tips = useRef(shuffle(GrowService.views.tips));

  async function followLink(url: string) {
    if (url === 'theme-library') return NavigationService.navigate('BrowseOverlays');
    if (/https/.test(url)) {
      remote.shell.openExternal(url);
    } else {
      try {
        const link = await MagicLinkService.getDashboardMagicLink(url);
        remote.shell.openExternal(link);
      } catch (e: unknown) {
        console.error('Error generating dashboard magic link', e);
      }
    }
  }

  return (
    <div className={styles.growthTipsContainer}>
      <h2>{$t('Growth Tips')}</h2>
      <Scrollable isResizable={false} style={{ height: '100%' }}>
        {tips.current.map(tip => (
          <div className={styles.card} key={tip.title}>
            <i className={tip.icon} />
            <strong>{tip.title}</strong>
            <p>{tip.description}</p>
            {tip.link && <Button onClick={() => followLink(tip.link)}>{tip.cta}</Button>}
          </div>
        ))}
      </Scrollable>
    </div>
  );
}
