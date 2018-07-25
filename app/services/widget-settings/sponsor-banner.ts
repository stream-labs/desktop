import { CODE_EDITOR_TABS, IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';
import { metadata } from 'components/shared/widget-inputs/WInput';

export interface ISponsorBannerSettings extends IWidgetSettings {

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
    return `https://${ this.getHost() }/widgets/sponsor-banner/v1/${this.getWidgetToken()}?simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/sponsorbanner`;
  }

  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS
  ];
}
