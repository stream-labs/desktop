import electron from 'electron';
import path from 'path';
import VueI18n from 'vue-i18n';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { mutation } from 'services/stateful-service';
import recursive from 'recursive-readdir';
import { Inject } from '../../util/injector';
import { FileManagerService } from 'services/file-manager';
import { IListInput, TFormData } from 'components/shared/forms/Input';
import { I18nServiceApi } from './i18n-api';
import * as obs from '../../../obs-api';


interface II18nState {
  locale: string;
}

const I18N_PATH = path.resolve('i18n');

export function $t(...args: any[]) {
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
  en:	{ lang: 'English', locale: 'en-US' },
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


export class I18nService extends PersistentStatefulService<II18nState> implements I18nServiceApi {

  static defaultState: II18nState = {
    locale: ''
  };

  static vueI18nInstance: VueI18n;

  static setVuei18nInstance(instance: VueI18n) {
    I18nService.vueI18nInstance = instance;
  }

  private availableLocales: Dictionary<string> = {};
  private loadedDictionaries: Dictionary<Dictionary<string>> = {};
  private isLoaded = false;

  @Inject() fileManagerService: FileManagerService;


  async load() {

    const WHITE_LIST = [
      'en-US',
      'ru-RU', 'zh-TW', 'da-DK', 'de-DE',
      'hu-HU', 'it-IT', 'ja-JP', 'pl-PL',
      'pt-PT', 'pt-BR', 'es-ES', 'tr-TR'
    ];

    if (this.isLoaded) return;

    // load available locales
    const localeFiles = await recursive(`${I18N_PATH}`, ['*.json']);
    for (const filePath of localeFiles) {
      const locale = filePath.split('\\').slice(-2)[0];
      if (!WHITE_LIST.includes(locale)) continue;
      this.availableLocales[locale] = this.fileManagerService.read(filePath);
    }

    // if locale is not set than use electron's one
    let locale = this.state.locale;
    if (!locale) {
      const electronLocale = electron.remote.app.getLocale();
      const langDescription = LANG_CODE_MAP[electronLocale];
      locale = langDescription ? langDescription.locale : 'en-US';
    }

    // load dictionary if not loaded
    if (!this.loadedDictionaries[locale]) {
      await this.loadDictionary(this.state.locale);
    }

    // load fallback dictionary
    const fallbackLocale = this.getFallbackLocale();
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

  setWebviewLocale(webview: Electron.WebviewTag) {
    const locale = this.state.locale;
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

  getLocaleFormData(): TFormData {
    const options = Object.keys(this.availableLocales)
      .map(locale => {
        return {
          value: locale,
          description: this.availableLocales[locale]
        };
      });

    return [
      <IListInput<string>>{
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

  private async loadDictionary(locale: string): Promise<Dictionary<string>> {
    if (this.loadedDictionaries[locale]) return this.loadedDictionaries[locale];

    const dictionaryFiles = await recursive(`${I18N_PATH}/${locale}`, ['*.txt']);
    const dictionary: Dictionary<string> = {};
    for (const filePath of dictionaryFiles) {
      Object.assign(dictionary, JSON.parse(this.fileManagerService.read(filePath)));
    }
    this.loadedDictionaries[locale] = dictionary;
    return dictionary;
  }

  @mutation()
  private SET_LOCALE(locale: string) {
    this.state.locale = locale;
  }

}
