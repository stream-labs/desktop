import { PersistentStatefulService, mutation, ViewHandler } from 'services/core';
import { GOAL_OPTIONS, tips } from './grow-data';

export interface IGoal {
  title: string;
  image: string;
  total: number;
  progress?: number;
}

interface IGrowServiceState {
  goals: IGoal[];
}

class GrowServiceViews extends ViewHandler<IGrowServiceState> {
  get platforms() {
    return [
      { name: 'Twitch', icon: 'twitch', followers: 1834 },
      { name: 'YouTube', icon: 'youtube', followers: 1112 },
      { name: 'Facebook', icon: 'facebook', followers: 1092 },
      { name: 'Twitter', icon: 'twitter' },
      { name: 'Instagram', icon: 'instagram' },
      { name: 'TikTok', icon: 'tiktok' },
      { name: 'Snapchat', icon: 'snapchat' },
    ];
  }

  get goals() {
    return this.state.goals;
  }

  get goalOptions(): IGoal[] {
    return GOAL_OPTIONS();
  }

  get tips() {
    return tips();
  }
}

export class GrowService extends PersistentStatefulService<IGrowServiceState> {
  static defaultState: IGrowServiceState = {
    goals: [],
  };

  @mutation()
  SET_GOALS(goals: IGoal[]) {
    this.state.goals = goals;
  }

  get views() {
    return new GrowServiceViews(this.state);
  }
}
