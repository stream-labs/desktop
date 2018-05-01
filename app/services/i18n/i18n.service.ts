import VueI18n from 'vue-i18n';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { mutation } from '../stateful-service';
import { Subject } from 'rxjs/Subject';

interface II18nState {
  locale: string;
}

export function $t(...args: any[]) {
  return I18nService.vueI18nInstance.t.call(
    I18nService.vueI18nInstance,
    ...args
  );
}

export class I18nService extends PersistentStatefulService<II18nState> {

  static defaultState: II18nState = {
    locale: 'ru-Ru'
  };

  static vueI18nInstance: VueI18n;

  static setVuei18nInstance(instance: VueI18n) {
    this.vueI18nInstance = instance;
  }

  localeChanged = new Subject<string>();
  dictionariesLoaded = new Subject<{locale: string, messages: Dictionary<string>}>();

  init() {
    this.loadDictionaries(this.state.locale);
  }

  setLocale(locale: string) {
    this.SET_LOCALE(locale);
    this.localeChanged.next(locale);
  }

  private loadDictionaries(locale: string) {

  }

  @mutation()
  private SET_LOCALE(locale: string) {
    this.state.locale = locale;
  }

}
