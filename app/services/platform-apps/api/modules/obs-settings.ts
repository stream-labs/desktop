import { Module, EApiPermissions, apiMethod, IApiContext } from './module';
import { SettingsService, ISettingsValues } from 'services/settings';
import { Inject } from 'services/core/injector';

export class ObsSettingsModule extends Module {
  moduleName = 'ObsSettings';
  permissions = [EApiPermissions.ObsSettings];

  @Inject() settingsService: SettingsService;

  @apiMethod()
  getSettings(): ISettingsValues {
    this.settingsService.loadSettingsIntoStore();
    return this.settingsService.views.values;
  }

  @apiMethod()
  setSettings(ctx: IApiContext, settingsPatch: Partial<ISettingsValues>) {
    this.settingsService.setSettingsPatch(settingsPatch);
  }
}
