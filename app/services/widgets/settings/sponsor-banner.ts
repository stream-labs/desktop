import { IWidgetData, IWidgetSettings, WidgetSettingsService, WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/stateful-service';

export interface ISponsorBannerSettings extends IWidgetSettings {
  background_color_option: boolean;
  background_container_color: string;
  banner_height: number;
  banner_width: number;
  hide_duration: number;
  hide_duration_secs: number;
  hide_duration_in_seconds: number;
  layout: string;
  placement_options: string;
  show_animation: string;
  show_duration: number;
  show_duration_secs: number;
  show_duration_in_seconds: number;
  image_1_href: string[];
  image_2_href: string[];
  placement1_durations: number[];
  placement2_durations: number[];
  placement_1_images: { href: string; duration: number }[];
  placement_2_images: { href: string; duration: number }[];
}

export interface ISponsorBannerData extends IWidgetData {
  settings: ISponsorBannerSettings;
}

@InheritMutations()
export class SponsorBannerService extends WidgetSettingsService<ISponsorBannerData> {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.SponsorBanner,
      url: `https://${this.getHost()}/widgets/sponsor-banner?token=${this.getWidgetToken()}`,
      previewUrl: `https://${this.getHost()}/widgets/sponsor-banner?token=${this.getWidgetToken()}`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/sponsorbanner`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/sponsorbanner`,
      settingsUpdateEvent: 'sponsorBannerSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }

  protected patchAfterFetch(data: any): ISponsorBannerData {
    data.settings.hide_duration_in_seconds =
      data.settings.hide_duration_secs + data.settings.hide_duration * 60;
    data.settings.show_duration_in_seconds =
      data.settings.show_duration_secs + data.settings.show_duration * 60;

    // make data structure interable and type-predictable
    data.settings.placement_1_images = data.settings.image_1_href.map((href: string, i: number) => {
      const subbedHref =
        href === '/imgs/streamlabs.png'
          ? 'https://cdn.streamlabs.com/static/imgs/logos/logo.png'
          : href;
      return { href: subbedHref, duration: data.settings.placement1_durations[i] };
    });
    data.settings.placement_2_images = data.settings.image_2_href.map((href: string, i: number) => {
      const subbedHref =
        href === '/imgs/streamlabs.png'
          ? 'https://cdn.streamlabs.com/static/imgs/logos/logo.png'
          : href;
      return { href: subbedHref, duration: data.settings.placement2_durations[i] };
    });
    return data;
  }

  protected patchBeforeSend(settings: ISponsorBannerSettings): any {
    settings.hide_duration = settings.hide_duration_in_seconds / 60;
    settings.hide_duration_secs = settings.hide_duration_in_seconds % 60;
    settings.show_duration = settings.show_duration_in_seconds / 60;
    settings.show_duration_secs = settings.show_duration_in_seconds % 60;

    settings.image_1_href = settings.placement_1_images.map(image => image.href);
    settings.placement1_durations = settings.placement_1_images.map(image => image.duration);
    settings.image_2_href = settings.placement_2_images.map(image => image.href);
    settings.placement2_durations = settings.placement_2_images.map(image => image.duration);

    return settings;
  }
}
