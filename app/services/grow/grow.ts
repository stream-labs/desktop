import Vue from 'vue';
import uuid from 'uuid/v4';
import { PersistentStatefulService, mutation, ViewHandler, Inject } from 'services/core';
import { HostsService } from 'services/hosts';
import { UserService } from 'services/user';
import { jfetch } from 'util/requests';
import { GOAL_OPTIONS, GROWTH_TIPS } from './grow-data';

export interface IGoal {
  id: string;
  title: string;
  image: string;
  total: number;
  progress?: number;
  startDate?: number;
}

export interface IUniversityProgress {
  name: string;
  avatar: string;
  finished_course_date?: string;
  total_progress: number;
  enrolled: boolean;
  stopped_at?: {
    title: string;
    description: string;
    image: string;
    url: string;
  };
}

interface IGrowServiceState {
  goals: Dictionary<IGoal>;
}

const ONE_WEEK = 6.048e8;

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
    return GROWTH_TIPS();
  }
}

export class GrowService extends PersistentStatefulService<IGrowServiceState> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  static defaultState: IGrowServiceState = {
    goals: {},
  };

  @mutation()
  ADD_GOAL(goal: IGoal) {
    Vue.set(this.state.goals, goal.id, goal);
  }

  @mutation()
  REMOVE_GOAL(goal: IGoal) {
    Vue.delete(this.state.goals, goal.id);
  }

  @mutation()
  INCREMENT_GOAL(goal: IGoal, amountToIncrement: number) {
    Vue.set(this.state.goals, goal.id, {
      ...goal,
      progress: goal.progress + amountToIncrement,
    });
  }

  async fetchUniversityProgress() {
    if (!this.userService.isLoggedIn) return;
    const url = `https://${this.hostsService.streamlabs}/university/api/user/info/${this.userService.widgetToken}`;
    const req = new Request(url);
    const json = (await jfetch(req)) as { user: IUniversityProgress };
    return json.user;
  }

  get views() {
    return new GrowServiceViews(this.state);
  }

  addGoal(goal: IGoal) {
    const goalWithId = {
      ...goal,
      progress: 0,
      startDate: Date.now(),
      id: goal.id === 'custom' ? uuid() : goal.id,
    };

    this.ADD_GOAL(goalWithId);
  }

  incrementGoal(goal: IGoal, amount: number) {
    this.INCREMENT_GOAL(goal, amount);
  }

  removeGoal(goal: IGoal) {
    this.REMOVE_GOAL(goal);
  }

  clearCompletedGoals() {
    Object.values(this.state.goals).forEach(goal => {
      if (goal.progress === goal.total) {
        this.removeGoal(goal);
      }
    });
  }

  timeLeft(goal: IGoal) {
    if (/week/.test(goal.id)) return goal.startDate + ONE_WEEK - Date.now();
    if (/month/.test(goal.id)) return goal.startDate + ONE_WEEK * 4 - Date.now();
    return Infinity;
  }
}
