import { IWidgetData, IWidgetSettings, WidgetSettingsService } from '../index';
import { WidgetType } from 'services/widgets';
import { clone } from 'lodash';
import { $t } from 'services/i18n';
import { InheritMutations } from '../../stateful-service';

export interface IMediaShareSettings extends IWidgetSettings {
  advanced_settings: {
    auto_play: boolean;
    auto_show: boolean;
    buffer_time: number;
    enabled: boolean;
    max_duration: number;
    min_amount_to_share: number;
    moderation_queue: boolean;
    price_per_second: number;
    requests_enabled: boolean;
    security: number;
    volume: number;
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

@InheritMutations()
export class MediaShareService extends WidgetSettingsService<IMediaShareData> {
  getApiSettings() {
    return {
      type: WidgetType.MediaShare,
      url: `https://${this.getHost()}/widgets/media-share?token=${this.getWidgetToken()}`,
      previewUrl: `https://${this.getHost()}/widgets/media-share?token=${this.getWidgetToken()}`,
      settingsUpdateEvent: 'mediaShareSettingsUpdate',
      goalCreateEvent: 'newmediaShare',
      goalResetEvent: 'mediaShareEnd',
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/media`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/media`,
      testers: ['Follow', 'Subscription', 'Donation', 'Bits', 'Host'],
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }

  async unbanMedia(media: IMediaShareBan) {
    const url = `${this.getApiSettings().dataFetchUrl}/unban`;
    await this.request({
      url,
      method: 'POST',
      body: {
        media: media.media,
      },
    });
    return this.fetchData();
  }

  protected patchAfterFetch(response: IMediaShareData): any {
    // we should be using settings.advanced settings values instead, similar to sl.com
    // so overwrite values for all keys in settings with settings.advance_settings
    return {
      ...response,
      settings: {
        ...response.settings,
        ...response.settings.advanced_settings,
      },
    };
  }

  protected patchBeforeSend(settings: IMediaShareSettings): any {
    // backend makes settings into advanced.settings and store in json
    // without deleting, it will nest settings.advanced_settings.advanced_settings x infinity
    delete settings.advanced_settings;
    return { settings };
  }
}
