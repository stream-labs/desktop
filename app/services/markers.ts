import moment from 'moment';
import { Inject, PersistentStatefulService, ViewHandler } from 'services/core';
import { UserService } from 'services/user';
import * as remote from '@electron/remote';
import electron from 'electron';
import { UsageStatisticsService } from './usage-statistics';
import { StreamingService } from './streaming';
import { $t } from './i18n';

interface ILoginTokenResponse {
  login_token: string;
  expires_at: number;
}

interface IMarkersServiceState {
  MARKER_1: string;
  MARKER_2: string;
  MARKER_3: string;
  MARKER_4: string;
}

class MarkersServiceViews extends ViewHandler<IMarkersServiceState> {
  getLabel(id: string) {
    if (!this.state) return id;
    return this.state[id];
  }
}

export class MarkersService extends PersistentStatefulService<IMarkersServiceState> {
  @Inject() streamingService: StreamingService;

  static get initialState(): IMarkersServiceState {
    return {
      MARKER_1: $t('Marker 1'),
      MARKER_2: $t('Marker 2'),
      MARKER_3: $t('Marker 3'),
      MARKER_4: $t('Marker 4'),
    };
  }

  markers: Dictionary<string> = {};

  get views() {
    return new MarkersServiceViews(this.state);
  }

  addMarker(label: string) {
    console.log(label, this.streamingService.state.recordingStatusTime);
    if (!this.streamingService.views.isRecording) return;
  }
}
