import { IWidgetData } from 'services/widgets';
import { formMetadata, metadata } from 'components/shared/inputs/index';
import { $t } from 'services/i18n';
import { BaseGoalService } from './base-goal';
import { InheritMutations } from 'services/stateful-service';


export interface IGoalData extends IWidgetData {
  goal: {
    title: string;
    goal_amount: number;
    current_amount: number;
    to_go: string;
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
    custom_html: string,
    custom_js: string,
    custom_css: string
  };
  custom_defaults: {
    html: string;
    js: string;
    css: string;
  };
  has_goal: boolean;
  show_bar: string;
}

export interface IGoalCreateOptions {
  title: string;
  goal_amount: number;
  manual_goal_amount: number;
  ends_at: string;
}

@InheritMutations()
export abstract class GenericGoalService extends BaseGoalService<IGoalData, IGoalCreateOptions> {

  getMetadata() {
    return formMetadata({

      title: metadata.text({
        title: $t('Title'),
        required: true,
        max: 60
      }),

      goal_amount: metadata.number({
        title: $t('Goal Amount'),
        required: true,
        min: 1
      }),

      manual_goal_amount: metadata.number({
        title: $t('Starting Amount'),
        min: 0
      }),

      ends_at: metadata.text({
        title: $t('End After'),
        required: true,
        dateFormat: 'MM/DD/YYYY',
        placeholder:'MM/DD/YYYY'
      }),

      layout: metadata.list({
        title: $t('Layout'),
        options: [
          { title: 'Standard', value: 'standard' },
          { title: 'Condensed', value: 'condensed' }
        ]
      }),

      background_color: metadata.color({
        title: $t('Background Color')
      }),

      bar_color: metadata.color({
        title: $t('Bar Color')
      }),

      bar_bg_color: metadata.color({
        title: $t('Bar Background Color')
      }),

      text_color: metadata.color({
        title: $t('Text Color'),
        tooltip: $t('A hex code for the base text color.')
      }),

      bar_text_color: metadata.color({
        title: $t('Bar Text Color')
      }),

      bar_thickness: metadata.slider({
        title: $t('Bar Thickness'),
        min: 32,
        max: 128,
        interval: 4
      }),

      font: metadata.fontFamily({
        title: $t('Font Family')
      })
    });
  }

  protected patchAfterFetch(data: IGoalData): IGoalData {
    // fix a bug when API returning an empty array instead of null
    if (Array.isArray(data.goal)) data.goal = null;
    return data;
  }

}
