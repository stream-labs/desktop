import moment from 'moment';
import fs from 'fs';
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

  static defaultState: IMarkersServiceState = {
    MARKER_1: 'Marker 1',
    MARKER_2: 'Marker 2',
    MARKER_3: 'Marker 3',
    MARKER_4: 'Marker 4',
  };

  markers: Dictionary<string> = {};

  get views() {
    return new MarkersServiceViews(this.state);
  }

  addMarker(label: string) {
    console.log(label, this.streamingService.formattedDurationInCurrentRecordingState);
    if (!this.streamingService.views.isRecording) return;
    const timestamp = this.streamingService.formattedDurationInCurrentRecordingState;
    this.markers[timestamp] = label;
  }

  get tableHeader() {
    return 'No,Timecode In,Timecode Out,Timecode Length,Frame In,Frame Out,Frame Length,Name,Comment,Color,\n';
  }

  get tableContents() {
    const markers = Object.keys(this.markers).sort((a, b) => (a < b ? -1 : 0));
    return markers
      .map((marker, i) => this.prepareRow(marker, this.markers[marker], i + 1))
      .join('\n');
  }

  prepareRow(timestamp: string, label: string, number: number) {
    return `${number},${timestamp}:00,${timestamp}:01,,,,0,"","${label}",blue,`;
  }

  exportCsv() {
    const content = this.tableHeader + this.tableContents;
    const file = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    // fs.writeFile(path.filePath, file);
  }
}
