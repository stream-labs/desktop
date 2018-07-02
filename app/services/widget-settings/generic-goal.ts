import { WidgetSettingsService } from './widget-settings';
import { IWSliderMetadata } from 'components/shared/widget-inputs/WSliderInput.vue';
import { IWListMetadata } from 'components/shared/widget-inputs/WListInput.vue';


export interface IGoalData {
  goal: {
    title: string;
    goal_amount: number;
    manual_goal_amount: number;
    ends_at: string;
  };
  settings: {
    background_color: string,
    bar_color: string,
    bar_bg_color: string,
    text_color: string,
    bar_text_color: string,
    font: string,
    bar_thickness: string,
    layout: string
    custom_enabled: boolean,
    custom_html?: string;
    custom_css?: string;
    custom_js?: string;
  };
  has_goal: boolean;
  widget: object;
  demo: object;
  show_bar: string;
  custom_defaults: {
    html?: string;
    css?: string;
    js?: string;
  };
}

export abstract class GenericGoalService extends WidgetSettingsService<IGoalData> {


  getMetadata() {
    return {
      layout: <IWListMetadata<string>>{
        options: [
          { description: 'Standard', value: 'standard' },
          { description: 'Condensed', value: 'condensed' }
        ]
      },
      bar_thickness: <IWSliderMetadata>{
        min: 32,
        max: 128,
        interval: 4
      }
    };
  }

  protected patchData(data: IGoalData): IGoalData {
    // fix bug when API returning an empty array instead of null
    if (Array.isArray(data.goal)) data.goal = null;
    return data;
  }

}
