import path from 'path';
import VueI18n from 'vue-i18n';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { mutation } from 'services/stateful-service';
import { Subject } from 'rxjs/Subject';
import recursive from 'recursive-readdir';
import { Inject } from '../../util/injector';
import { FileManagerService } from 'services/file-manager';
import { IListInput, TFormData } from 'components/shared/forms/Input';


interface II18nState {
  locale: string;
}

const I18N_PATH = path.resolve('app/i18n');

export function $t(...args: any[]) {
  return I18nService.vueI18nInstance.t.call(
    I18nService.vueI18nInstance,
    ...args
  );
}

export class I18nService extends PersistentStatefulService<II18nState> {

  static defaultState: II18nState = {
    locale: 'ru-RU'
  };

  static vueI18nInstance: VueI18n;

  static setVuei18nInstance(instance: VueI18n) {
    this.vueI18nInstance = instance;
  }

  localeChanged = new Subject<string>();
  dictionariesLoaded = new Subject<{locale: string, dictionary: Dictionary<string>}>();

  private availableLocales: Dictionary<string> = {};
  private loadedDictionaries: Dictionary<Dictionary<string>> = {};

  @Inject() fileManagerService: FileManagerService;


  async init() {

    // load available locales
    const localeFiles = await recursive(`${I18N_PATH}`, ['*.json']);
    for (const filePath of localeFiles) {
      const locale = filePath.split('\\').slice(-2)[0];
      this.availableLocales[locale] = this.fileManagerService.read(filePath);
    }

    return this.setLocale(this.state.locale);
  }

  async setLocale(locale: string) {

    // load dictionary if not loaded
    if (!this.loadedDictionaries[locale]) {
      await this.loadDictionary(this.state.locale);
    }

    this.SET_LOCALE(locale);
    this.localeChanged.next(locale);
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

  async loadDictionary(locale: string): Promise<Dictionary<string>> {
    if (this.loadedDictionaries[locale]) return this.loadedDictionaries[locale];

    const dictionaryFiles = await recursive(`${I18N_PATH}/${locale}`, ['*.txt']);
    const dictionary: Dictionary<string> = {};
    for (const filePath of dictionaryFiles) {
      Object.assign(dictionary, JSON.parse(this.fileManagerService.read(filePath)));
    }
    this.loadedDictionaries[locale] = dictionary;
    this.dictionariesLoaded.next({ locale, dictionary });
    return dictionary;
  }

  @mutation()
  private SET_LOCALE(locale: string) {
    this.state.locale = locale;
  }

}
