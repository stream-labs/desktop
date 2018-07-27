import { CODE_EDITOR_TABS, IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';

export interface ISponsorBannerSettings extends IWidgetSettings {
  background_color_option: boolean;
  background_container_color: string;
  banner_height: number;
  banner_width: number;
  hide_duration: number;
  hide_duration_secs: number;
  image_1_href: string[];
  layout: string;
  placement1_durations: number[];
  placement_options: string;
  show_animation: string;
  show_duration: number;
  show_duration_secs: number;
  images: { href: string, duration: number }[];
}

export interface ISponsorBannerData extends IWidgetData {
  settings: ISponsorBannerSettings;
}

export class SponsorBannerService extends WidgetSettingsService<ISponsorBannerData> {

  getWidgetType() {
    return WidgetType.SponsorBanner;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${this.getHost()}/widgets/sponsor-banner/v1/${this.getWidgetToken()}?simulate=1`;
  }

  getDataUrl() {
    return `https://${this.getHost()}/api/v${this.getVersion()}/slobs/widget/sponsorbanner`;
  }

  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS
  ];

  protected patchAfterFetch(data: any): ISponsorBannerData {
    // make data structure interable and type-predictable
    data.settings.images = Object.keys(data.settings)
      .filter((key) => /image_\d_href/.test(key))
      .map((key, i) => ({ href: data.settings[key][0], duration: data.settings[`placement${i + 1}_durations`][0] }))
    return data;
  }

  protected patchBeforeSend(settings: ISponsorBannerSettings): any {
    settings.images.forEach((image, i) => {
      settings[`image_${i + 1}_href`] = [image.href];
      settings[`placement${i + 1}_durations`] = [image.duration];
    });

    return settings;
  }
}
