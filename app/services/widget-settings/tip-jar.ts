import { CODE_EDITOR_TABS, IWidgetData, WidgetSettingsService } from './widget-settings';
import { ISliderMetadata, IListMetadata } from 'components/shared/inputs/index';
import { WidgetType } from 'services/widgets';


interface ITipDarTierData {
  clear_image: string;
  image_src: string;
  minimum_amount: number;
}

export interface ITipJarData extends IWidgetData {
  widget: {
    url: string;
    simulate: string;
  };
  defaultImage: { twitch_account: string };
  jars: string[];
  settings: {
    theme: 'twitch';
    background_color: string;
    text: { color: string, font: string, show: boolean };
    text_size: number;
    custom_enabled: boolean;
    custom_html_enabled: boolean;
    custom_html: string;
    custom_js: string;
    custom_css: string;
    types: {
      tips: { enabled: boolean, minimum_amount?: number, tiers: ITipDarTierData[] },
      twitch_bits: { enabled: boolean, minimum_amount?: number },
      twitch_follows: { enabled: boolean, image_src?: string },
      twitch_resubs: { enabled: boolean, minimum_amount?: number },
      twitch_subs: { enabled: boolean, minimum_amount?: number }
    };
  };
  custom_defaults: {
    html: string;
    js: string;
    css: string;
  };
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

  getMetadata() {
    return {
      theme: <IListMetadata<string>>{
        options: [
          { description: 'Clean', value: 'standard' },
          { description: 'Boxed', value: 'boxed' },
          { description: 'Twitch', value: 'twitch' },
          { description: 'Old School', value: 'oldschool' },
          { description: 'Chunky', value: 'chunky' }
        ]
      },
      message_hide_delay: <ISliderMetadata> {
        min: 0,
        max: 200
      }
    };
  }

  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS
  ];

  protected patchAfterFetch(data: ITipJarData): ITipJarData {
    return data;
  }

  protected patchBeforeSend(data: ITipJarData['settings']): ITipJarData['settings'] {
    data.custom_html_enabled = data.custom_enabled;
    return data;
  }


}
