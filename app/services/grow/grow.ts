import Vue from 'vue';
import uuid from 'uuid/v4';
import { StatefulService, mutation, ViewHandler, Inject } from 'services/core';
import { HostsService } from 'services/hosts';
import { UserService } from 'services/user';
import { jfetch, authorizedHeaders } from 'util/requests';
import { GOAL_OPTIONS, GROWTH_TIPS } from './grow-data';
import { TwitchService } from 'services/platforms/twitch';
import { YoutubeService } from 'services/platforms/youtube';
import { FacebookService } from 'services/platforms/facebook';
import { TPlatform } from 'services/platforms';

export interface IGoal {
  id?: number;
  type: string;
  title: string;
  image: string;
  total: number;
  progress?: number;
  startDate?: string;
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

export interface ICommunityReach {
  icon: TPlatform;
  followers?: number;
}

interface IGrowServiceState {
  goals: Dictionary<IGoal>;
}

const ONE_WEEK = 6.048e8;

class GrowServiceViews extends ViewHandler<IGrowServiceState> {
  get platformOptions(): ICommunityReach[] {
    return [{ icon: 'twitch' }, { icon: 'youtube' }, { icon: 'facebook' }];
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

  goalExpiredOrComplete(goal: IGoal) {
    if (goal.progress === goal.total) return true;
    if (this.timeLeft(goal) <= 0) return true;
    return false;
  }

  timeLeft(goal: IGoal) {
    if (!goal.startDate) return Infinity;
    if (/week/.test(goal.type)) return Date.parse(goal.startDate) + ONE_WEEK - Date.now();
    if (/month/.test(goal.type)) return Date.parse(goal.startDate) + ONE_WEEK * 4 - Date.now();
    return Infinity;
  }
}

export class GrowService extends StatefulService<IGrowServiceState> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;
  @Inject() twitchService: TwitchService;
  @Inject() youtubeService: YoutubeService;
  @Inject() facebookService: FacebookService;

  static defaultState: IGrowServiceState = {
    goals: {},
  };

  @mutation()
  ADD_GOAL(goal: IGoal) {
    Vue.set(this.state.goals, goal.type, goal);
  }

  @mutation()
  REMOVE_GOAL(goal: IGoal) {
    Vue.delete(this.state.goals, goal.type);
  }

  @mutation()
  SET_GOAL(goal: IGoal) {
    Vue.set(this.state.goals, goal.type, goal);
  }

  formGoalRequest(method = 'GET', body?: any) {
    const url = `${this.hostsService.streamlabs}/api/v5/slobs/growth/goal`;
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    return new Request(url, { headers, method, body });
  }

  fetchGoals() {
    jfetch<IGoal[]>(this.formGoalRequest()).then(json =>
      json.forEach(goal => {
        this.ADD_GOAL(goal);
      }),
    );
  }

  async fetchPlatformFollowers() {
    const platforms = this.userService.views.platforms;

    const platformService = {
      twitch: this.twitchService,
      facebook: this.facebookService,
      youtube: this.youtubeService,
    };

    const communityReach: ICommunityReach[] = [];

    await Promise.all(
      Object.keys(platforms)
        .filter(platform => platform !== 'tiktok')
        .map(async platform => {
          const followers = await platformService[platform].fetchFollowers();
          communityReach.push({ icon: platform as TPlatform, followers });
        }),
    );

    return communityReach;
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
      startDate: new Date().toISOString(),
      type: goal.type === '' ? uuid() : goal.type,
    };

    jfetch(this.formGoalRequest('POST', goalWithId));
    this.ADD_GOAL(goalWithId);
  }

  incrementGoal(goalId: string, amount: number) {
    const goal = this.state.goals[goalId];
    if (!goal || this.views.goalExpiredOrComplete(goal)) return;
    const newProgress = amount + goal.progress;

    jfetch(this.formGoalRequest('PUT', { ...goal, progress: newProgress }));
    this.SET_GOAL({ ...goal, progress: newProgress });
  }

  removeGoal(goal: IGoal) {
    jfetch(this.formGoalRequest('DELETE', { id: goal.id }));
    this.REMOVE_GOAL(goal);
  }

  clearCompletedGoals() {
    Object.values(this.state.goals).forEach(goal => {
      if (goal.progress === goal.total) {
        this.removeGoal(goal);
      }
    });
  }
}
