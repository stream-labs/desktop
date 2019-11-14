import { TFormData } from 'components/shared/forms/Input';


interface II18nState {
  locale: string;
}

export interface I18nServiceApi {

  state: II18nState;

  setLocale(locale: string): void;
  getLocaleFormData(): TFormData;
}
