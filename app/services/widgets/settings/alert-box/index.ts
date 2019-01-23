import uuid from 'uuid/v4';
import { IWidgetData, WidgetSettingsService, WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from '../widget-settings';
import { InheritMutations } from 'services/stateful-service';
import {
  IAlertBoxApiSettings,
  IAlertBoxMixerSettings,
  IAlertBoxSetting,
  IAlertBoxSettings,
  IAlertBoxVariation,
} from './alert-box-api';
import { API_NAME_MAP, conditions, newVariation, REGEX_TESTERS } from './alert-box-data';
import { IWidgetSettings } from '../../widgets-api';
import { $t } from 'services/i18n';
import { metadata } from 'components/widgets/inputs';

export interface IAlertBoxData extends IWidgetData {
  settings: IAlertBoxSettings;
  custom: { js: string; html: string; css: string };
  tts_languages?: any[];
}

@InheritMutations()
export class AlertBoxService extends WidgetSettingsService<IAlertBoxData> {
  static initialState = WIDGET_INITIAL_STATE;

  apiNames() {
    return Object.keys(API_NAME_MAP).map(key => API_NAME_MAP[key]);
  }

  getApiSettings() {
    return {
      type: WidgetType.AlertBox,
      url: `https://${this.getHost()}/alert-box/v3/${this.getWidgetToken()}`,
      previewUrl: `https://${this.getHost()}/alert-box/v3/${this.getWidgetToken()}`,
      dataFetchUrl: `https://${this.getHost()}/api/v5/slobs/widget/alertbox?include_linked_integrations_only=true`,
      settingsSaveUrl: `https://${this.getHost()}/api/v5/slobs/widget/alertbox`,
      settingsUpdateEvent: 'filteredAlertBoxSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
      testers: ['Follow', 'Subscription', 'Donation', 'Bits', 'Host'],
    };
  }

  conditionsByType(type: string) {
    return conditions().base.concat(conditions()[type]);
  }

  newVariation(type: string): IAlertBoxVariation {
    return newVariation(type);
  }

  toggleCustomCode(enabled: boolean, data: IWidgetSettings, variation: IAlertBoxVariation) {
    const newSettings = { ...data };
    Object.keys(newSettings).forEach(type => {
      const variations = newSettings[type].variations;
      const found =
        variations && variations.find((vari: IAlertBoxVariation) => variation.id === vari.id);
      if (found) {
        found.settings.customHtmlEnabled = enabled;
      }
    });
    this.saveSettings(newSettings);
  }

  getMetadata(type: string, languages: any[]) {
    return {
      moderationDelay: metadata.slider({ title: $t('Alert Moderation delay'), min: 0, max: 600 }),
      alertDelay: metadata.slider({ title: $t('Global Alert Delay'), min: 0, max: 30 }),
      textThickness: metadata.slider({
        title: $t('Font Weight'),
        min: 300,
        max: 900,
        interval: 100,
      }),
      soundVolume: metadata.slider({ title: $t('Volume'), min: 0, max: 100 }),
      messageWeight: metadata.slider({
        title: $t('Font Weight'),
        min: 300,
        max: 900,
        interval: 100,
      }),
      ttsVolume: metadata.slider({ title: $t('Volume'), min: 0, max: 100 }),
      duration: metadata.slider({ title: $t('Alert Duration'), min: 2, max: 300 }),
      textDelay: metadata.slider({ title: $t('Text Delay'), min: 0, max: 60 }),
      ttsSecurity: metadata.spamSecurity({
        title: $t('Spam Security'),
        tooltip: $t(
          'This setting helps control text to speech spam, such as "wwwwwwwwwww." ' +
            'By default this is turned off, but most users will want to set this to Low or Medium. ' +
            'The higher the security, the less spam, but also a higher chance of a legitimate message being flagged ' +
            'as spam and not being read.',
        ),
        data: [$t('Off'), $t('Low'), $t('Medium'), $t('High')],
        indexModifier: 1,
      }),
      ttsLanguage: metadata.sectionedMultiselect({ title: $t('Language'), options: languages }),
      conditions: metadata.list({
        title: $t('Variation Condition'),
        options: this.conditionsByType(type),
      }),
      fontSize: metadata.fontSize({ title: $t('Font Size') }),
      fontFamily: metadata.fontFamily({ title: $t('Font') }),
      minAmount: metadata.number({ title: $t('Min. Amount to Show') }),
      conditionData: metadata.number({ title: $t('Variation Amount') }),
      minTriggerAmount: metadata.number({ title: $t('Min. Amount to Trigger Alert') }),
      minRecentEvents: metadata.number({ title: $t('Min. Amount to Show in Recent Events') }),
      ttsMinAmount: metadata.number({ title: $t('Min. Amount to Read') }),
      showAnimation: metadata.animation({ title: $t('Show Animation'), filter: 'in' }),
      hideAnimation: metadata.animation({ title: $t('Hide Animation'), filter: 'out' }),
      textAnimation: metadata.animation({ title: $t('Text Animation'), filter: 'text' }),
      bgColor: metadata.color({ title: $t('Background Color') }),
      primaryColor: metadata.color({ title: $t('Text Color Primary') }),
      secondaryColor: metadata.color({ title: $t('Text Color Secondary') }),
      textColor: metadata.color({ title: $t('Text Color') }),
      showMessage: metadata.toggle({ title: $t('Show Message?') }),
      messageEmojis: metadata.toggle({ title: $t('Allow Twitch Emojis?') }),
      ttsEnabled: metadata.toggle({ title: $t('Enable TTS?') }),
      unlimitedAlertMod: metadata.toggle({ title: $t('Unlimited Alert Moderation Delay') }),
      unlimitedMediaMod: metadata.toggle({
        title: $t('Unlimited Media Sharing Alert Moderation Delay'),
      }),
      imageFile: metadata.mediaGallery({ title: $t('Image/Video File') }),
      soundFile: metadata.sound({ title: $t('Sound File') }),
      variationFrequency: metadata.frequency({ title: $t('Variation Frequency') }),
      template: metadata.textArea({ title: $t('Message Template') }),
    };
  }

  protected patchAfterFetch(data: {
    settings: IAlertBoxApiSettings;
    type: WidgetType;
    custom: { js: string; html: string; css: string };
  }): IAlertBoxData {
    const { settings, ...rest } = data;
    const newSettings = settings.mixer_account
      ? this.transformSettings({ ...settings, ...settings.mixer_account })
      : this.transformSettings(settings);
    return { ...rest, settings: newSettings, custom_defaults: rest.custom };
  }

  protected patchBeforeSend(settings: IAlertBoxSettings): IAlertBoxApiSettings {
    return this.flattenSettings(settings);
  }

  private transformSettings(settings: IAlertBoxApiSettings): IAlertBoxSettings {
    const triagedSettings = this.triageSettings(settings);
    Object.keys(triagedSettings).forEach(key => {
      if (key === 'subs') {
        triagedSettings['subs'] = this.varifySetting({
          showResubMessage: triagedSettings['resubs'].show_message,
          ...triagedSettings['subs'],
          ...triagedSettings['resubs'],
        });
      } else if (this.apiNames().includes(key) && key !== 'resubs') {
        triagedSettings[key] = this.varifySetting(triagedSettings[key]);
      }
    });
    // resubs are folded into the sub settings
    triagedSettings['resubs'] = undefined;

    return triagedSettings;
  }

  private triageSettings(settings: IAlertBoxApiSettings): IAlertBoxSettings {
    const newSettings = {} as IAlertBoxSettings;
    Object.keys(settings).forEach(key => {
      let testSuccess = false;
      REGEX_TESTERS.forEach(test => {
        const newKey = /^show/.test(key)
          ? key.replace(test.tester, 'show_')
          : key.replace(test.tester, '');
        if (test.tester.test(key)) {
          testSuccess = true;
          if (!newSettings[test.name]) {
            newSettings[test.name] = { [newKey]: settings[key] };
          } else {
            newSettings[test.name][newKey] = settings[key];
          }
        }
      });
      if (['alert_delay', 'moderation_delay'].includes(key)) {
        newSettings[key] = Math.floor(settings[key] / 1000);
      } else if (!testSuccess && !/smfredemption/.test(key)) {
        newSettings[key] = settings[key];
      }

      // These settings are handled differently and purposely dropped on the floor in reshapeVariation
      newSettings.bits_alert_min_amount = settings.bits_alert_min_amount;
      newSettings.donation_alert_min_amount = settings.donation_alert_min_amount;
      newSettings.host_viewer_minimum = settings.host_viewer_minimum;
      newSettings.raid_raider_minimum = settings.raid_raider_minimum;
    });

    return newSettings;
  }

  private varifySetting(setting: any): IAlertBoxSetting {
    const { show_message, enabled, variations, showResubMessage, ...rest } = setting;
    const defaultVariation = this.reshapeVariation(rest);
    const idVariations = variations.map((variation: IAlertBoxVariation) => ({
      id: uuid(),
      ...variation,
    }));
    idVariations.unshift(defaultVariation);
    return { enabled, showResubMessage, showMessage: show_message, variations: idVariations };
  }

  private reshapeVariation(setting: any): IAlertBoxVariation {
    const imgHref =
      setting.image_href === '/images/gallery/default.gif'
        ? 'http://uploads.twitchalerts.com/image-defaults/1n9bK4w.gif'
        : setting.image_href;
    return {
      condition: null,
      conditionData: null,
      conditions: [],
      name: 'Default',
      id: 'default',
      settings: {
        customCss: setting.custom_css,
        customHtml: setting.custom_html,
        customHtmlEnabled: setting.custom_html_enabled,
        customJs: setting.custom_js,
        customJson: setting.custom_json,
        duration: Math.floor(setting.alert_duration / 1000),
        hideAnimation: setting.hide_animation,
        image: { href: imgHref },
        layout: setting.layout,
        showAnimation: setting.show_animation,
        sound: { href: setting.sound_href, volume: setting.sound_volume },
        text: {
          animation: setting.text_animation,
          color: setting.font_color,
          color2: setting.font_color2,
          font: setting.font,
          format: setting.message_template,
          resubFormat: setting.resub_message_template,
          tierUpgradeFormat: setting.tier_upgrade_message_template,
          size: setting.font_size,
          thickness: setting.font_weight,
        },
        textDelay: Math.floor(setting.text_delay / 1000),
        type: '',
        useCustomImage: setting.use_custom_image,
        moderation: setting.moderation,
        gif: {
          enabled: setting.gif_enabled,
          gfycatLibraryEnabled: setting.gfycat_library_enabled,
          animation: setting.gif_animation,
          libraryDefaults: setting.gif_library_defaults,
          libraryEnabled: setting.gif_library_enabled,
          minAmount: setting.gifs_min_amount_to_share,
          duration: setting.max_gif_duration ? Math.floor(setting.max_gif_duration / 1000) : null,
        },
        message: {
          minAmount: setting.message_min_amount || setting.alert_message_min_amount,
          allowEmotes: setting.message_allow_emotes,
          font: setting.message_font,
          color: setting.message_font_color,
          size: setting.message_font_size,
          weight: setting.message_font_weight,
        },
        tts: {
          enabled: setting.tts_enabled,
          minAmount: setting.tts_min_amount,
          language: setting.tts_language,
          security: setting.tts_security,
          volume: setting.tts_volume,
        },
      },
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
      [`${prefix}_resub_message_template`]: settings.text.resubFormat,
      [`${prefix}_tier_upgrade_message_template`]: settings.text.tierUpgradeFormat,
      [`${prefix}_alert_message_min_amount`]: settings.message.minAmount,
      [`${prefix}_use_custom_image`]: settings.useCustomImage,
      [`${prefix}_moderation`]: settings.moderation,
      [`${prefix}_message_allow_emotes`]: settings.message.allowEmotes,
      [`${prefix}_message_font`]: settings.message.font,
      [`${prefix}_message_font_color`]: settings.message.color,
      [`${prefix}_message_font_size`]: settings.message.size,
      [`${prefix}_message_font_weight`]: settings.message.weight,
      [`${prefix}_tts_enabled`]: settings.tts.enabled,
      [`${prefix}_tts_min_amount`]: settings.tts.minAmount,
      [`${prefix}_tts_language`]: settings.tts.language,
      [`${prefix}_tts_security`]: settings.tts.security,
      [`${prefix}_tts_volume`]: settings.tts.volume,
      [`${prefix}_gif_enabled`]: settings.gif.enabled,
      [`${prefix}_gfycat_library_enabled`]: settings.gif.gfycatLibraryEnabled,
      [`${prefix}_gif_animation`]: settings.gif.animation,
      [`${prefix}_gif_library_defaults`]: settings.gif.libraryDefaults,
      [`${prefix}_gif_library_enabled`]: settings.gif.libraryEnabled,
      [`${prefix}_gifs_min_amount_to_share`]: settings.gif.minAmount,
      [`${prefix}_max_gif_duration`]: settings.gif.duration,
    };
  }

  private unshapeSubs(variation: IAlertBoxVariation) {
    const { settings } = variation;
    return {
      sub_custom_css: settings.customCss,
      sub_custom_html: settings.customHtml,
      sub_custom_html_enabled: settings.customHtmlEnabled,
      sub_custom_js: settings.customJs,
      sub_custom_json: settings.customJson,
      sub_alert_duration: settings.duration,
      sub_hide_animation: settings.hideAnimation,
      sub_show_animation: settings.showAnimation,
      sub_image_href: settings.image.href,
      sub_layout: settings.layout,
      sub_sound_href: settings.sound.href,
      sub_sound_volume: settings.sound.volume,
      sub_text_animation: settings.text.animation,
      sub_font_color: settings.text.color,
      sub_font_color2: settings.text.color2,
      sub_font: settings.text.font,
      sub_message_template: settings.text.format,
      sub_font_size: settings.text.size,
      sub_font_weight: settings.text.thickness,
      sub_text_delay: settings.textDelay,
      resub_message_allow_emotes: settings.message.allowEmotes,
      resub_message_font: settings.message.font,
      resub_message_font_color: settings.message.color,
      resub_message_font_size: settings.message.size,
      resub_message_font_weight: settings.message.weight,
      resub_tts_enabled: settings.tts.enabled,
      resub_tts_language: settings.tts.language,
      resub_tts_security: settings.tts.security,
      resub_tts_volume: settings.tts.volume,
    };
  }

  private flattenSettings(settings: IAlertBoxSettings): IAlertBoxApiSettings {
    const settingsObj = {} as IAlertBoxApiSettings;
    Object.keys(settings).forEach(setting => {
      const prefix = Object.keys(API_NAME_MAP).find(key => API_NAME_MAP[key] === setting);
      if (prefix && prefix !== 'resub') {
        const bitsPrefix = prefix === 'bit' ? 'bits' : prefix;
        const defaultVariation = settings[setting].variations.shift();
        settingsObj[`${prefix}_variations`] = settings[setting].variations;
        settingsObj[`${bitsPrefix}_enabled`] = settings[setting].enabled;
        settingsObj[`show_${bitsPrefix}_message`] = settings[setting].showMessage;
        const flattenedDefault =
          prefix === 'sub'
            ? this.unshapeSubs(defaultVariation)
            : this.unshapeVariation(defaultVariation, bitsPrefix);
        Object.keys(flattenedDefault).forEach(key => {
          settingsObj[key] = flattenedDefault[key];
        });
      } else if (prefix !== 'resub') {
        settingsObj[setting] = settings[setting];
      }
      settingsObj.show_resub_message = settings.subs.showResubMessage;
    });
    return settingsObj;
  }
}
