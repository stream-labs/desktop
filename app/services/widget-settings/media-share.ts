import { IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';

export interface IMediaShareSettings extends IWidgetSettings {
  advanced_settings: {
    auto_play: boolean,
    auto_show: boolean,
    buffer_time: number,
    enabled: boolean,
    max_duration: number,
    min_amount_to_share: number,
    moderation_queue: boolean,
    price_per_second: number,
    requests_enabled: boolean,
    security: number,
    volume: number,
  };
  allowed_types: string[];
  auto_show_video: boolean;
  enabled: boolean;
  max_duration: number;
  min_amount_to_share: number;
  price_per_second: number;
  security: number;
  volume: number;
}

export interface IMediaShareData extends IWidgetData {
  settings: IMediaShareSettings;
  banned_media: string[];
}

export class MediaShareService extends WidgetSettingsService<IMediaShareData> {

  getWidgetType() {
    return WidgetType.MediaShare;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/media/v1/${this.getWidgetToken()}?simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/media`;
  }

  protected tabs = [
    { name: 'settings' },
  ];
}
