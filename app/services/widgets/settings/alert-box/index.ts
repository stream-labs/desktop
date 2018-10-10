import { IWidgetData, WidgetSettingsService } from 'services/widgets';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from '../widget-settings';
import { InheritMutations } from 'services/stateful-service';
import { IAlertBoxSettings, IAlertBoxApiSettings, IAlertBoxSetting, IAlertBoxVariation } from './alert-box-api';

const API_NAME_MAP =  {
  bit: 'bits',
  donation: 'donations',
  donordrive: 'donordrive',
  pledge: 'patreon',
  eldonation: 'extraLife',
  justgivingdonation: 'justGiving',
  merch: 'merch',
  resub: 'resubs',
  tiltifydonation: 'tiltify',
  treat: 'treat',
  follow: 'follows',
  host: 'hosts',
  raid: 'raids'
};

const REGEX_TESTERS = Object.keys(API_NAME_MAP).map((key) => (
  { name: API_NAME_MAP[key], tester: new RegExp(`^${key}s?_|show_${key}_`) }
));

export interface IAlertBoxData extends IWidgetData {
  settings: IAlertBoxSettings;
}


@InheritMutations()
export class AlertBoxService extends WidgetSettingsService<IAlertBoxData> {
  static initialState = WIDGET_INITIAL_STATE;

  apiNames() {
    return Object.keys(API_NAME_MAP).map((key) => API_NAME_MAP[key]);
  }

  getApiSettings() {
    return {
      type: WidgetType.AlertBox,
      url: `https://${ this.getHost() }/widgets/alert-box?token=${this.getWidgetToken()}`,
      previewUrl: `https://${ this.getHost() }/widgets/alert-box?token=${this.getWidgetToken()}`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/alertbox`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/alertbox`,
      settingsUpdateEvent: 'alertBoxSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true
    }
  }

  protected patchAfterFetch(data: { settings: IAlertBoxApiSettings, type: WidgetType }): IAlertBoxData {
    const { settings, ...rest } = data;
    const newSettings = this.transformSettings(settings);
    return { ...rest, settings: newSettings };
  }

  protected patchBeforeSend(settings: IAlertBoxSettings) {

    return settings;
  }

  private transformSettings(settings: IAlertBoxApiSettings): IAlertBoxSettings {
    const triagedSettings = this.triageSettings(settings);
    Object.keys(triagedSettings).forEach((key) => {
      if(this.apiNames().includes(key) && key !== 'resubs') {
        triagedSettings[key] = this.varifySetting(triagedSettings[key]);
      }
    })

    return triagedSettings;
  }

  private triageSettings(settings: IAlertBoxApiSettings): IAlertBoxSettings {
    const newSettings= {} as IAlertBoxSettings;
    REGEX_TESTERS.forEach((test) => {
      Object.keys(settings).forEach((key) => {
        let newKey = key;
        if (test.tester.test(key)) {
          newKey = /^show/.test(key) ? key.replace(test.tester, 'show_') : key.replace(test.tester, '');
        }
        if (!newSettings[test.name]) {
          newSettings[test.name] = { [newKey]: settings[key] };
        } else {
          newSettings[test.name][newKey] = settings[key];
        }
      });
    });

    return newSettings;
  }

  private varifySetting(setting: any): IAlertBoxSetting {
    const { show_message, enabled, variations, ...rest } = setting;
    const defaultVariation = this.reshapeVariation(rest);
    variations.unshift(defaultVariation);
    return { showMessage: show_message, enabled, variations };
  }

  private reshapeVariation(setting: any): IAlertBoxVariation {
    return {
      condition: null,
      conditionData: null,
      conditions: [],
      name: 'Default',
      settings: {
        customCss: setting.custom_css,
        customHtml: setting.custom_html,
        customHtmlEnabled: setting.custom_html_enabled,
        customJs: setting.custom_js,
        customJson: setting.custom_json,
        duration: setting.alert_duration,
        hideAnimation: setting.hide_animation,
        image: { href: setting.image_href },
        layout: setting.layout,
        showAnimation: setting.show_animation,
        sound: { href: setting.sound_href, volume: setting.sound_volume },
        text: {
          animation: setting.text_animation,
          color: setting.font_color,
          color2: setting.font_color2,
          font: setting.font,
          format: setting.message_template,
          size: setting.font_size,
          thickness: setting.font_weight
        },
        textDelay: setting.text_delay,
        type: ''
      }
    };
  }
}
