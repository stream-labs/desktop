import uuid from 'uuid/v4';
import { IWidgetData, WidgetSettingsService } from 'services/widgets';
import { WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from '../widget-settings';
import { InheritMutations } from 'services/stateful-service';
import { IAlertBoxSettings, IAlertBoxApiSettings, IAlertBoxSetting, IAlertBoxVariation } from './alert-box-api';

const API_NAME_MAP =  {
  bit: 'bits',
  donation: 'donations',
  donordrivedonation: 'donordrive',
  pledge: 'patreon',
  eldonation: 'extraLife',
  justgivingdonation: 'justGiving',
  merch: 'merch',
  resub: 'resubs',
  gamewispsubscription: 'gamewisp',
  sub: 'subs',
  tiltifydonation: 'tiltify',
  treat: 'treat',
  follow: 'follows',
  host: 'hosts',
  raid: 'raids'
};

const REGEX_TESTERS = Object.keys(API_NAME_MAP).map((key) => (
  { name: API_NAME_MAP[key], tester: new RegExp(`^${key}s?_|show_${key}_`) }
));

export interface IAlertBoxData extends IWidgetData { settings: IAlertBoxSettings; }

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

  protected patchBeforeSend(settings: IAlertBoxSettings): IAlertBoxApiSettings {
    return this.flattenSettings(settings);
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
    Object.keys(settings).forEach((key) => {
      let testSuccess = false;
      REGEX_TESTERS.forEach((test) => {
        const newKey = /^show/.test(key) ? key.replace(test.tester, 'show_') : key.replace(test.tester, '');
        if (test.tester.test(key)) {
          testSuccess = true;
          if (!newSettings[test.name]) {
            newSettings[test.name] = { [newKey]: settings[key] };
          } else {
            newSettings[test.name][newKey] = settings[key];
          }
        }
      });
      if (!testSuccess && !/smfredemption/.test(key)) newSettings[key] = settings[key];
    });

    return newSettings;
  }

  private varifySetting(setting: any): IAlertBoxSetting {
    const { show_message, enabled, variations, ...rest } = setting;
    const defaultVariation = this.reshapeVariation(rest);
    const idVariations = variations.map((variation: IAlertBoxVariation) => ({ id: uuid(), ...variation }))
    idVariations.unshift(defaultVariation);
    return { showMessage: show_message, enabled, variations: idVariations };
  }

  private reshapeVariation(setting: any): IAlertBoxVariation {
    return {
      condition: null,
      conditionData: null,
      conditions: [],
      name: 'Default',
      id: uuid(),
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

  private unshapeVariation(variation: IAlertBoxVariation, prefix: string) {
    const { settings } = variation;
    return {
      [`${prefix}_custom_css`]: settings.customCss,
      [`${prefix}_custom_html`]: settings.customHtml,
      [`${prefix}_custom_html_enabled`]: settings.customHtmlEnabled,
      [`${prefix}_custom_js`]: settings.customJs,
      [`${prefix}_custom_json`]: settings.customJson,
      [`${prefix}_alert_duration`]: settings.duration,
      [`${prefix}_hide_animation`]: settings.hideAnimation,
      [`${prefix}_show_animation`]: settings.showAnimation,
      [`${prefix}_image_href`]: settings.image.href,
      [`${prefix}_layout`]: settings.layout,
      [`${prefix}_sound_href`]: settings.sound.href,
      [`${prefix}_sound_volume`]: settings.sound.volume,
      [`${prefix}_text_animation`]: settings.text.animation,
      [`${prefix}_font_color`]: settings.text.color,
      [`${prefix}_font_color2`]: settings.text.color2,
      [`${prefix}_font`]: settings.text.font,
      [`${prefix}_message_template`]: settings.text.format,
      [`${prefix}_font_size`]: settings.text.size,
      [`${prefix}_font_weight`]: settings.text.thickness,
      [`${prefix}_text_delay`]: settings.textDelay,
    };
  }

  private flattenSettings(settings: IAlertBoxSettings): IAlertBoxApiSettings {
    const settingsObj = {} as IAlertBoxApiSettings;
    Object.keys(settings).forEach((setting) => {
      const prefix = Object.keys(API_NAME_MAP).find(() => API_NAME_MAP[setting]);
      if (prefix) {
        const bitsPrefix = prefix === 'bit' ? 'bits' : prefix;
        const defaultVariation = settings[setting].variations.shift();
        settingsObj[`${prefix}_variations`] = settings[setting].variations;
        settingsObj[`${bitsPrefix}_enabled`] = settings[setting].enabled;
        settingsObj[`show_${bitsPrefix}_message`] = settings[setting].showMessage;
        const flattenedDefault = this.unshapeVariation(defaultVariation, bitsPrefix);
        Object.keys(flattenedDefault).forEach((key) => settingsObj[key] = flattenedDefault[key]);
      } else {
        settingsObj[setting] = settings[setting];
      }
    });

    return settingsObj;
  }
}
