import React from 'react';
import { ObsGenericSettingsForm, ObsSettingsSection } from './ObsSettings';
import { I18nService } from '../../../services/i18n';
import { confirmAsync } from '../../modals';
import { ListInput } from '../../shared/inputs';

export function GeneralSettings() {
  return (
    <>
      <LanguageSettings />
      <ObsGenericSettingsForm />
    </>
  );
}

GeneralSettings.page = 'General';

function LanguageSettings() {
  const i18nService = I18nService.instance as I18nService;
  const localeOptions = i18nService.state.localeList;
  const currentLocale = i18nService.state.locale;

  async function save(lang: string) {
    if (!(await confirmAsync('This action will restart the application. Continue?'))) {
      return;
    }
    i18nService.actions.setLocale(lang);
  }

  return (
    <ObsSettingsSection>
      <ListInput options={localeOptions} label={'Language'} onChange={save} value={currentLocale} />
    </ObsSettingsSection>
  );
}
