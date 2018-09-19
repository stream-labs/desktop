import { Service } from '../service';
import { nodeObs } from '../obs-api';
import { continentMap } from './continent-map';

export type TConfigEvent =
  'starting_step' |
  'progress' |
  'stopping_step' |
  'error' |
  'done';

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
    this.fetchLocation(cb).then(continent => {
      nodeObs.InitializeAutoConfig(
        (progress: IConfigProgress) => {
          this.handleProgress(progress);
          cb(progress);
        },
        {
          service_name: 'Twitch',
          continent
        }
      );

      nodeObs.StartBandwidthTest();
    });
  }

  handleProgress(progress: IConfigProgress) {
    if (progress.event === 'stopping_step') {
      if (progress.description === 'bandwidth_test') {
        nodeObs.StartStreamEncoderTest();
      } else if (progress.description === 'streamingEncoder_test') {
        nodeObs.StartRecordingEncoderTest();
      } else if (progress.description === 'recordingEncoder_test') {
        nodeObs.StartCheckSettings();
      } else if (progress.description === 'checking_settings') {
        nodeObs.StartSaveStreamSettings();
      } else if (progress.description === 'saving_service') {
        nodeObs.StartSaveSettings();
      } else if (progress.description === 'setting_default_settings') {
        nodeObs.StartSaveStreamSettings();
      }
    }

    if (progress.event === 'error') {
      nodeObs.StartSetDefaultSettings();
    }

    if (progress.event === 'done') {
      nodeObs.TerminateAutoConfig();
    }
  }

  // Uses GeoIP to detect the user's location to narrow
  // down the number of servers we need to test.
  fetchLocation(cb: TConfigProgressCallback) {
    const request = new Request('http://freegeoip.net/json/');

    cb({
      event: 'starting_step',
      description: 'detecting_location',
      percentage: 0
    });

    return fetch(request).then(response => {
      cb({
        event: 'stopping_step',
        description: 'detecting_location',
        percentage: 100
      });

      return response.json();
    }).then(json => {
      const continent = this.countryCodeToContinent(json.country_code);

      cb({
        event: 'stopping_step',
        description: 'location_found',
        continent
      });

      return continent;
    }).catch(() => {
      return 'Other';
    });
  }

  countryCodeToContinent(code: string) {
    return continentMap[code];
  }


}
