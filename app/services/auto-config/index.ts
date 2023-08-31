import { Subject } from 'rxjs';
import debounce from 'lodash/debounce';
import { Service } from '../core/service';
import * as obs from '../../../obs-api';
import { Inject } from 'services';
import { StreamSettingsService } from 'services/settings/streaming';
import { getPlatformService } from 'services/platforms';
import { TwitchService } from 'services/platforms/twitch';
import { SettingsService, YoutubeService } from 'app-services';
import { VideoSettingsService } from 'services/settings-v2/video';
import { UserService } from 'services/user';

export type TConfigEvent = 'starting_step' | 'progress' | 'stopping_step' | 'error' | 'done';

export interface IConfigStep {
  startMethod: string;
  identifier: string;
}

export interface IConfigProgress {
  event: TConfigEvent;
  description: string;
  percentage?: number;
  continent?: string;
}

export class AutoConfigService extends Service {
  @Inject() streamSettingsService: StreamSettingsService;
  @Inject() videoSettingsService: VideoSettingsService;
  @Inject() userService: UserService;
  @Inject() private settingsService: SettingsService;

  configProgress = new Subject<IConfigProgress>();

  async start() {
    /**
     * Temporarily disable optimizer until migrated to the new API
     */
    return;

    // try {
    //   if (this.userService.views.isTwitchAuthed) {
    //     const service = getPlatformService('twitch') as TwitchService;
    //     const key = await service.fetchStreamKey();
    //     this.streamSettingsService.setSettings({ key, platform: 'twitch' });
    //   } else if (this.userService.views.isYoutubeAuthed) {
    //     const service = getPlatformService('youtube') as YoutubeService;
    //     await service.beforeGoLive({
    //       platforms: {
    //         youtube: {
    //           enabled: true,
    //           useCustomFields: false,
    //           title: 'bandwidthTest',
    //           description: 'bandwidthTest',
    //           privacyStatus: 'private',
    //           categoryId: '1',
    //         },
    //       },
    //       advancedMode: true,
    //       customDestinations: [],
    //     });
    //   }
    // } catch (e: unknown) {
    //   console.error('Failure fetching stream key for auto config');
    //   this.handleProgress({ event: 'error', description: 'error_fetching_stream_key' });
    //   return;
    // }

    // const settings = this.settingsService.views.values;
    // obs.NodeObs.InitializeAutoConfig(
    //   (progress: IConfigProgress) => {
    //     this.handleProgress(progress);
    //     this.configProgress.next(progress);
    //   },
    //   { continent: '', service_name: '', bind_ip: settings.Advanced.BindIP },
    // );

    // obs.NodeObs.StartBandwidthTest();
  }

  async startRecording() {
    obs.NodeObs.InitializeAutoConfig(
      (progress: IConfigProgress) => this.handleRecordingProgress(progress),
      { continent: '', service_name: '' },
    );

    obs.NodeObs.StartRecordingEncoderTest();
  }

  handleProgress(progress: IConfigProgress) {
    if (progress.event === 'stopping_step') {
      if (progress.description === 'bandwidth_test') {
        obs.NodeObs.StartStreamEncoderTest();
      } else if (progress.description === 'streamingEncoder_test') {
        obs.NodeObs.StartRecordingEncoderTest();
      } else if (progress.description === 'recordingEncoder_test') {
        obs.NodeObs.StartCheckSettings();
      }
    }

    let applySettings = false;
    if (progress.event === 'error') {
      obs.NodeObs.UseAutoConfigDefaultSettings();
      obs.NodeObs.TerminateAutoConfig();
      this.configProgress.next(progress);
      applySettings = true;
    }

    if (progress.event === 'done') {
      obs.NodeObs.TerminateAutoConfig();
      this.videoSettingsService.loadLegacySettings();
      applySettings = true;
    }

    if (applySettings) {
       const settings = obs.NodeObs.GetNewSettings() as Array<[string, string, any]>;
       for (const settingsTuple of settings) {
         const [category, name, value] = settingsTuple;
         if (category === 'Video') {
           this.videoSettingsService.setVideoSetting(name, value);
         } else {
           this.settingsService.setSettingValue(category, name, value);
         }
       }
    }
  }

  handleRecordingProgress(progress: IConfigProgress) {
    if (progress.event === 'stopping_step') {
      if (progress.description === 'recordingEncoder_test') {
        obs.NodeObs.StartSaveSettings();
      } else {
        obs.NodeObs.TerminateAutoConfig();

        this.videoSettingsService.loadLegacySettings();
        debounce(() => this.configProgress.next({ ...progress, event: 'done' }), 1000)();
      }
    }
  }
}
