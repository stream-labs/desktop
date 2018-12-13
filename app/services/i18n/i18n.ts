import electron from 'electron';
import VueI18n from 'vue-i18n';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { mutation } from 'services/stateful-service';
import { Inject } from '../../util/injector';
import { FileManagerService } from 'services/file-manager';
import { IObsListInput, TObsFormData } from 'components/obs/inputs/ObsInput';
import { I18nServiceApi } from './i18n-api';
import * as obs from '../../../obs-api';
import * as fs from 'fs';
import path from 'path';

interface II18nState {
  locale: string;
}

export function $t(...args: any[]): string {
  const vueI18nInstance = I18nService.vueI18nInstance;

  // some tests try to call this function before dictionaries have been loaded
  if (!vueI18nInstance) return args[0];

  return vueI18nInstance.t.call(
    I18nService.vueI18nInstance,
    ...args
  );
}

/**
 * @see https://electronjs.org/docs/api/locales
 */
const LANG_CODE_MAP = {
  cs: { lang: 'Czech', locale: 'cs-CZ' },
  de: { lang: 'German', locale: 'de-DE' },
  'en-US':	{ lang: 'English', locale: 'en-US' },
  es: { lang: 'Spanish', locale: 'es-ES' },
  fr: { lang: 'French', locale: 'fr-FR' },
  it:	{ lang: 'Italian', locale: 'it-IT' },
  ja: { lang: 'Japanese', locale: 'ja-JP' },
  ko:	{ lang: 'Korean', locale: 'ko-KR' },
  pl: { lang:	'Polish', locale: 'pl-PL' },
  pt: { lang: 'Portuguese', locale: 'pt-PT' },
  'pt-BR': { lang: 'Portuguese (Brazil)', locale: 'pt-BR' },
  ru: { lang: 'Russian', locale: 'ru-RU' },
  sk: { lang: 'Slovak', locale: 'sk-SK' },
  th:	{ lang: 'Thai', locale: 'th-TH' },
  tr:	{ lang: 'Turkish', locale: 'tr-TR' },
  'zh-CN': { lang: 'Chinese (Simplified)' }
};

const WHITE_LIST = [
  'en-US',
  'ru-RU', 'zh-TW', 'da-DK', 'de-DE',
  'hu-HU', 'it-IT', 'ja-JP', 'Ko-KR', 'pl-PL',
  'pt-PT', 'pt-BR', 'es-ES',  'fr-FR', 'tr-TR',
];

export class I18nService extends PersistentStatefulService<II18nState> implements I18nServiceApi {

  static defaultState: II18nState = {
    locale: ''
  };

  static vueI18nInstance: VueI18n;

  static setVuei18nInstance(instance: VueI18n) {
    I18nService.vueI18nInstance = instance;
  }

  static setWebviewLocale(webview: Electron.WebviewTag) {
    if (!webview) return;

    // use a static method here because it allows to accept unserializable arguments like webview from other windows
    const i18nService = I18nService.instance as I18nService; // TODO: replace with getResource('I18nService')
    const locale = i18nService.state.locale;
    webview.addEventListener('dom-ready', () => {
      webview.executeJavaScript(`
        var langCode = $.cookie('langCode');
        if (langCode !== '${locale}') {
           $.cookie('langCode', '${locale}');
           window.location.reload();
        }
      `);
    });
  }

  private availableLocales: Dictionary<string> = {};
  private loadedDictionaries: Dictionary<Dictionary<string>> = {};
  private isLoaded = false;

  @Inject() fileManagerService: FileManagerService;


  async load() {

    if (this.isLoaded) return;
    const i18nPath = this.getI18nPath();

    // load available locales
    const localeFiles = fs.readdirSync(i18nPath);

    for (const locale of localeFiles) {
      if (!this.localeIsSupported(locale)) continue;
      this.availableLocales[locale] = this.fileManagerService.read(`${i18nPath}/${locale}/langname.txt`);
    }

    // if locale is not set than use electron's one
    let locale = this.state.locale;
    if (!locale) {
      const electronLocale = electron.remote.app.getLocale();
      const langDescription = LANG_CODE_MAP[electronLocale];
      locale = langDescription ? langDescription.locale : 'en-US';
    }

    // if electron has unsupported locale, don't allow to use it
    const fallbackLocale = this.getFallbackLocale();
    if (!this.localeIsSupported(locale)) locale = fallbackLocale;

    // load dictionary if not loaded
    if (!this.loadedDictionaries[locale]) {
      await this.loadDictionary(locale);
    }

    // load fallback dictionary
    if (!this.loadedDictionaries[fallbackLocale]) {
      await this.loadDictionary(fallbackLocale);
    }

    // setup locale in libobs
    obs.Global.locale = locale;

    this.SET_LOCALE(locale);

    this.isLoaded = true;
  }

  getFallbackLocale() {
    return 'en-US';
  }

  getLoadedDictionaries() {
    return this.loadedDictionaries;
  }

  setLocale(locale: string) {
    this.SET_LOCALE(locale);
    electron.remote.app.relaunch();
    electron.remote.app.quit();
  }

  getLocaleFormData(): TObsFormData {
    const options = Object.keys(this.availableLocales)
      .map(locale => {
        return {
          value: locale,
          description: this.availableLocales[locale]
        };
      });

    return [
      <IObsListInput<string>>{
        type: 'OBS_PROPERTY_LIST',
        name: 'locale',
        description: $t('Language'),
        value: this.state.locale,
        enabled: true,
        visible: true,
        options
      }
    ];
  }

  private getI18nPath() {
    return path.join(electron.remote.app.getAppPath(),'app/i18n');
  }

  private async loadDictionary(locale: string): Promise<Dictionary<string>> {
    if (this.loadedDictionaries[locale]) return this.loadedDictionaries[locale];

    const i18nPath = this.getI18nPath();
    const dictionaryFiles = fs.readdirSync(`${i18nPath}/${locale}`)
      .filter(fileName => fileName.split('.')[1] === 'json');

    const dictionary: Dictionary<string> = {};
    for (const fileName of dictionaryFiles) {
      Object.assign(dictionary, JSON.parse(this.fileManagerService.read(`${i18nPath}/${locale}/${fileName}`)));
    }
    this.loadedDictionaries[locale] = dictionary;
    return dictionary;
  }

  private localeIsSupported(locale: string) {
    return WHITE_LIST.includes(locale) && fs.existsSync(`${this.getI18nPath()}/${locale}`)
  }

  @mutation()
  private SET_LOCALE(locale: string) {
    this.state.locale = locale;
  }

}
