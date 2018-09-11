import { IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';
import { clone } from 'lodash';

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
    return `http://${this.getHost()}/api/v${this.getVersion()}/slobs/widget/media`;
  }

  protected tabs = [
    { name: 'settings' },
  ];


  protected patchBeforeSend(settings: IMediaShareSettings): any {
    return {
      settings: {
        allowed_types: settings.allowed_types,
        auto_show_video: settings.auto_show_video,
        enabled: settings.enabled,
        max_duration: settings.max_duration,
        min_amount_to_share: settings.min_amount_to_share,
        price_per_second: settings.price_per_second,
        security: settings.security,
        volume: settings.volume,
        advanced_settings: {
          auto_play: settings.advanced_settings.auto_play,
          auto_show: settings.advanced_settings.auto_show,
          buffer_time: settings.advanced_settings.buffer_time,
          enabled: settings.advanced_settings.enabled,
          max_duration: settings.advanced_settings.max_duration,
          min_amount_to_share: settings.advanced_settings.min_amount_to_share,
          moderation_queue: settings.advanced_settings.moderation_queue,
          price_per_second: settings.advanced_settings.price_per_second,
          requests_enabled: settings.advanced_settings.requests_enabled,
          security: settings.advanced_settings.security,
          volume: settings.advanced_settings.volume,
        }
      }
    };
  }
}
