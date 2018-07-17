import { CODE_EDITOR_TABS, IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';
import { IGoalData } from './generic-goal';
import { IWSliderMetadata } from 'components/shared/widget-inputs/WSliderInput.vue';
import { $t } from 'services/i18n';

export interface IStreamBossSettings extends IWidgetSettings {
  background_color: string;
  bar_bg_color: string;
  bar_color: string;
  bar_text_color: string;
  bg_transparent: boolean;
  bit_multiplier: number;
  boss_heal: boolean;
  donation_multiplier: boolean;
  fade_time: number;
  follow_multiplier: boolean;
  font: string;
  incr_amount: string;
  kill_animation: string;
  overkill_min: number;
  overkill_multiplier: number;
  skin: string;
  sub_multiplier: number;
  superchat_multiplier: number;
  text_color: string;
}

export interface IStreamBossData extends IWidgetData {
  goal: {
    boss_img: string;
    boss_name: string;
    current_health: number;
    mode: string;
    multiplier: 1;
    percent: number;
    total_health: number;
  };
  settings: IStreamBossSettings;
}

export abstract class StreamBossService extends WidgetSettingsService<IStreamBossData> {



  getWidgetType() {
    return WidgetType.BitGoal;
  }

  protected tabs = [
    {
      name: 'goal',
      saveUrl: `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/streamboss`,
      autosave: false
    },
    {
      name: 'settings',
    },

    ...CODE_EDITOR_TABS
  ];

  getVersion() {
    return 5;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/streamboss/settings`;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/bit-goal?token=${this.getWidgetToken()}`;
  }

  getMetadata() {
    return {
      // layout: <IWListMetadata<string>>{
      //   options: [
      //     { description: 'Standard', value: 'standard' },
      //     { description: 'Condensed', value: 'condensed' }
      //   ]
      // },
      fade_time: <IWSliderMetadata>{
        min: 0,
        max: 20,
        description: $t('Set to 0 to always appear on screen')
      }
    };
  }

  protected patchAfterFetch(data: any): IGoalData {
    // fix a bug when API returning an empty array instead of null
    if (Array.isArray(data.goal)) data.goal = null;
    return data;
  }

}
