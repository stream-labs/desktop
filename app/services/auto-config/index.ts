import { Service } from '../core/service';
import * as obs from '../../../obs-api';

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

type TConfigProgressCallback = (progress: IConfigProgress) => void;

export class AutoConfigService extends Service {
  start(cb: TConfigProgressCallback) {
    obs.NodeObs.InitializeAutoConfig(
      (progress: IConfigProgress) => {
        this.handleProgress(progress);
        cb(progress);
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
