import { Observable } from 'rxjs/Observable';
import { TObsFormData } from 'components/shared/forms/ObsInput';


interface II18nState {
  locale: string;
}

export interface I18nServiceApi {

  state: II18nState;

  setLocale(locale: string): void;
  getLocaleFormData(): TObsFormData;
}
