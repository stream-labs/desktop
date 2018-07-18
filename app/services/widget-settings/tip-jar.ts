import { CODE_EDITOR_TABS, IWidgetData, WidgetSettingsService } from './widget-settings';
import { IWSliderMetadata } from 'components/shared/widget-inputs/WSliderInput.vue';
import { IWListMetadata } from 'components/shared/widget-inputs/WListInput.vue';
import { WidgetType } from 'services/widgets';



export interface ITipJarData extends IWidgetData {
  widget: {
    url: string;
    simulate: string;
  };
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
      tips: { enabled: boolean, minimum_amount?: number, tiers: any[] },
      twitch_bits: { enabled: boolean, minimum_amount?: number },
      twitch_follows: { enabled: boolean, minimum_amount?: number },
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
    return `https://${ this.getHost() }/widgets/tipjar/v1/${this.getWidgetToken()}?simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/tipjar`;
  }

  getMetadata() {
    return {
      theme: <IWListMetadata<string>>{
        options: [
          { description: 'Clean', value: 'standard' },
          { description: 'Boxed', value: 'boxed' },
          { description: 'Twitch', value: 'twitch' },
          { description: 'Old School', value: 'oldschool' },
          { description: 'Chunky', value: 'chunky' }
        ]
      },
      message_hide_delay: <IWSliderMetadata> {
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

  protected patchBeforeSend(data: ITipJarData): ITipJarData {
    data.settings.custom_html_enabled = data.settings.custom_enabled;
    return data;
  }


}
