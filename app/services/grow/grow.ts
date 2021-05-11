import { PersistentStatefulService, mutation, ViewHandler, Inject } from 'services/core';
import { HostsService } from 'services/hosts';
import { UserService } from 'services/user';
import { jfetch } from 'util/requests';
import { GOAL_OPTIONS, GROWTH_TIPS } from './grow-data';

export interface IGoal {
  title: string;
  image: string;
  total: number;
  progress?: number;
  startDate?: Date;
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
    return GROWTH_TIPS();
  }
}

export class GrowService extends PersistentStatefulService<IGrowServiceState> {
  @Inject() userService: UserService;
  @Inject() hostsService: HostsService;

  static defaultState: IGrowServiceState = {
    goals: [],
  };

  @mutation()
  SET_GOALS(goals: IGoal[]) {
    this.state.goals = goals;
  }

  async fetchUniversityProgress() {
    if (!this.userService.isLoggedIn) return;
    const url = `${this.hostsService.streamlabs}/university/api/user/info/${this.userService.widgetToken}`;
    const req = new Request(url);
    const json = (await jfetch(req)) as { user: IUniversityProgress };
    return json.user;
  }

  get views() {
    return new GrowServiceViews(this.state);
  }
}
