import { Observable } from 'rxjs/Observable';
import { TFormData } from 'components/shared/forms/Input';


interface II18nState {
  locale: string;
}

export interface I18nServiceApi {

  state: II18nState;
  localeChanged: Observable<string>;
  dictionariesLoaded: Observable<{locale: string, dictionary: Dictionary<string>}>;

  setLocale(locale: string): Promise<void>;
  getLocaleFormData(): TFormData;
}
