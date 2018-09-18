import { IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';
import { clone } from 'lodash';
import { $t } from 'services/i18n';

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
  banned_media: IMediaShareBan[];
}

export interface IMediaShareBan {
  id: number;
  user_id: number;
  media_type: string;
  media: string;
  media_title: string;
  action_by: string;
  created_at?: string;
  updated_at?: string;
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
    return `https://${this.getHost()}/api/v${this.getVersion()}/slobs/widget/media`;
  }

  async unbanMedia(media: IMediaShareBan) {
    const url = `${this.getDataUrl()}/unban`;
    await this.request({
      url,
      method: 'POST',
      body: {
        media: media.media
      }
    });
    return this.fetchData();
  }

  protected tabs = [
    { name: 'settings', title: $t('Settings') },
    { name: 'banned_media', title: $t('Banned Media') },
  ];

  protected patchAfterFetch(response: IMediaShareData): any {
    // we should be using settings.advanced settings values instead, similar to sl.com
    // so overwrite values for all keys in settings with settings.advance_settings
    debugger;
    return {
      ...response,
      settings: {
        ...response.settings,
        ...response.settings.advanced_settings
      }
    }
  }

  protected patchBeforeSend(settings: IMediaShareSettings): any {
    // backend makes settings into advanced.settings and store in json
    // without deleting, it will nest settings.advanced_settings.advanced_settings x infinity
    delete settings.advanced_settings;
    return { settings };
  }
}
