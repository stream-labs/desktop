interface II18nState {
  locale: string;
}

export interface I18nServiceApi {
  state: II18nState;

  setLocale(locale: string): void;
}
