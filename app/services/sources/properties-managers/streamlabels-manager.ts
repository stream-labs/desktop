import { DefaultManager, IDefaultManagerSettings } from './default-manager';
import { Inject } from 'util/injector';
import { StreamlabelsService, IStreamlabelSubscription } from 'services/streamlabels';
import { getDefinitions } from 'services/streamlabels/definitions';
import { UserService } from 'services/user';

export interface IStreamlabelsManagerSettings extends IDefaultManagerSettings {
  statname: string;
}

export class StreamlabelsManager extends DefaultManager {

  @Inject() streamlabelsService: StreamlabelsService;
  @Inject() userService: UserService;

  settings: IStreamlabelsManagerSettings;
  private subscription: IStreamlabelSubscription;
  blacklist = ['read_from_file', 'file'];
  customUIComponent = 'StreamlabelProperties';

  destroy() {
    this.unsubscribe();
  }

  normalizeSettings() {
    const youtubeKeys = {
      most_recent_follower: 'most_recent_youtube_subscriber',
      session_followers: 'session_youtube_subscribers',
      session_follower_count: 'session_youtube_subscriber_count',
      session_most_recent_follower: 'session_most_recent_youtube_subscriber',
      total_subscriber_count: 'total_youtube_sponsor_count',
      most_recent_subscriber: 'most_recent_youtube_sponsor',
      session_subscribers: 'session_youtube_sponsors',
      session_subscriber_count: 'session_youtube_sponsor_count',
      session_most_recent_subscriber: 'session_most_recent_youtube_sponsor',
    };

    const mixerKeys = {
      most_recent_follower: 'most_recent_mixer_follower',
      session_followers: 'session_mixer_followers',
      session_follower_count: 'session_mixer_follower_count',
      session_most_recent_follower: 'session_most_recent_mixer_follower',
      most_recent_subscriber: 'most_recent_mixer_subscriber',
      session_subscribers: 'session_mixer_subscribers',
      session_subscriber_count: 'session_mixer_subscriber_count',
      session_most_recent_subscriber: 'session_most_recent_mixer_subscriber',
    };

    if (this.userService.platform) {
      if (this.userService.platform.type === 'youtube') {
        if (youtubeKeys[this.settings.statname]) {
          this.settings.statname = youtubeKeys[this.settings.statname];
        }
      }

      if (this.userService.platform.type === 'mixer') {
        if (mixerKeys[this.settings.statname]) {
          this.settings.statname = mixerKeys[this.settings.statname];
        }
      }
    }
  }

  applySettings(settings: Dictionary<any>) {
    this.settings = {
      // Default to All-Time Top Donator
      statname: 'all_time_top_donator',
      ...this.settings,
      ...settings
    };

    this.normalizeSettings();

    this.refreshSubscription();
  }


  private unsubscribe() {
    if (this.subscription) {
      this.streamlabelsService.unsubscribe(this.subscription);
    }
  }


  private refreshSubscription() {
    this.unsubscribe();

    this.subscription = this.streamlabelsService.subscribe(this.settings.statname);

    this.obsSource.update({
      ...this.obsSource.settings,
      read_from_file: true,
      file: this.subscription.path
    });
  }

}
