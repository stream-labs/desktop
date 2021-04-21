import { Service } from '../core/service';
import * as obs from '../../../obs-api';
import { Inject } from 'services';
import { StreamSettingsService } from 'services/settings/streaming';
import { getPlatformService } from 'services/platforms';
import { TwitchService } from 'services/platforms/twitch';
import { Subject } from 'rxjs';

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

  configProgress = new Subject<IConfigProgress>();

  async start() {
    const service = getPlatformService('twitch') as TwitchService;

    try {
      const key = await service.fetchStreamKey();
      this.streamSettingsService.setSettings({ key, platform: 'twitch' });
    } catch (e: unknown) {
      console.error('Failure fetching stream key for auto config');
      this.handleProgress({ event: 'error', description: 'error_fetching_stream_key' });
      return;
    }

    obs.NodeObs.InitializeAutoConfig(
      (progress: IConfigProgress) => {
        this.handleProgress(progress);
        this.configProgress.next(progress);
      },
      { continent: '', service_name: '' },
    );

    obs.NodeObs.StartBandwidthTest();
  }

  handleProgress(progress: IConfigProgress) {
    if (progress.event === 'stopping_step') {
      if (progress.description === 'bandwidth_test') {
        obs.NodeObs.StartStreamEncoderTest();
      } else if (progress.description === 'streamingEncoder_test') {
        obs.NodeObs.StartRecordingEncoderTest();
      } else if (progress.description === 'recordingEncoder_test') {
        obs.NodeObs.StartCheckSettings();
      } else if (progress.description === 'checking_settings') {
        obs.NodeObs.StartSaveStreamSettings();
      } else if (progress.description === 'saving_service') {
        obs.NodeObs.StartSaveSettings();
      } else if (progress.description === 'setting_default_settings') {
        obs.NodeObs.StartSaveStreamSettings();
      }
    }

    if (progress.event === 'error') {
      obs.NodeObs.StartSetDefaultSettings();
    }

    if (progress.event === 'done') {
      obs.NodeObs.TerminateAutoConfig();
    }
  }
}
