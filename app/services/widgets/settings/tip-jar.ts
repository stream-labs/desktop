import { CODE_EDITOR_TABS, IWidgetData, WidgetSettingsService, IWidgetSettings } from './widget-settings';
import { ISliderMetadata, IListMetadata } from 'components/shared/inputs/index';
import { WidgetType } from 'services/widgets/index';
import { createInterface } from 'readline';


interface ITipDarTierData {
  clear_image: string;
  image_src: string;
  minimum_amount: number;
}

interface ITipJarSettings extends IWidgetSettings {
  theme: string;
  background_color: string;
  background: any;
  custom_html_enabled: boolean;
  text: { color: string, font: string, show: boolean, size: number };
  types: {
    tips: { enabled: boolean, minimum_amount?: number, tiers: ITipDarTierData[] },
    twitch_bits: { enabled: boolean, minimum_amount?: number },
    twitch_follows: { enabled: boolean, image_src?: string },
    twitch_resubs: { enabled: boolean, minimum_amount?: number },
    twitch_subs: { enabled: boolean, minimum_amount?: number }
  };
}

export interface ITipJarData extends IWidgetData {
  widget: {
    url: string;
    simulate: string;
  };
  defaultImage: { twitch_account: string };
  jars: string[];
  settings: ITipJarSettings;
}

export class TipJarService extends WidgetSettingsService<ITipJarData> {

  getWidgetType() {
    return WidgetType.TipJar;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/tip-jar/v1/${this.getWidgetToken()}?simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/tipjar`;
  }

  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS,
    { name: 'test' }
  ];

  protected patchAfterFetch(data: any): ITipJarData {
    data.settings.custom_enabled = data.settings.custom_html_enabled;
    data.settings.background_color = data.settings.background.color;
    return data;
  }

  protected patchBeforeSend(data: ITipJarSettings): any {
    data.custom_html_enabled = data.custom_enabled;
    data.background.color = data.background_color;
    return data;
  }


}
