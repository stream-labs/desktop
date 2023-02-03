import fs from 'fs';
import path from 'path';
import { Inject, PersistentStatefulService, ViewHandler } from 'services/core';
import { UsageStatisticsService } from './usage-statistics';
import { $t } from './i18n';
import { StreamingService } from './streaming';
import { SettingsService } from './settings';
import { ENotificationType, NotificationsService } from './notifications';

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
  @Inject() settingsService: SettingsService;
  @Inject() notificationsService: NotificationsService;
  @Inject() usageStatisticsService: UsageStatisticsService;

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

  get hasMarkers() {
    return Object.keys(this.markers).length > 0;
  }

  addMarker(label: string) {
    if (!this.streamingService.views.isRecording) return;
    const timestamp = this.streamingService.formattedDurationInCurrentRecordingState;
    this.markers[timestamp] = this.views.getLabel(label);

    this.notificationsService.push({
      type: ENotificationType.SUCCESS,
      message: $t('Marker %{label} added at %{timestamp}', { label, timestamp }),
      lifeTime: 1000,
    });

    this.usageStatisticsService.recordFeatureUsage('Markers');
  }

  get tableHeader() {
    return 'No,Timecode In,Timecode Out,Timecode Length,Frame In,Frame Out,Frame Length,Name,Comment,Color,\n';
  }

  get tableContents() {
    const markers = Object.keys(this.markers).sort((a, b) => (a < b ? -1 : 0));
    return markers.map((marker, i) => this.prepareRow(marker, i + 1)).join('\n');
  }

  prepareRow(timestamp: string, number: number) {
    const label = this.markers[timestamp];
    return `${number},${timestamp}:00,${timestamp}:01,,,,0,"","${label}",blue,`;
  }

  async exportCsv(filename: string) {
    if (!this.hasMarkers) return;
    const parsedFilename = path.parse(filename);
    const directory = path.join(parsedFilename.dir, parsedFilename.name);
    const content = this.tableHeader + this.tableContents;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const fileBuffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFile(`${directory}_markers.csv`, fileBuffer, () => {});

    this.markers = {};
  }
}
