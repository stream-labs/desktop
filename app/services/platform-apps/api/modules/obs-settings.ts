import { Module, EApiPermissions, apiMethod, IApiContext } from './module';
import { SettingsService, ISettingsState } from 'services/settings';
import { Inject } from 'services/core/injector';

export class ObsSettingsModule extends Module {
  moduleName = 'ObsSettings';
  permissions = [EApiPermissions.ObsSettings];

  @Inject() settingsService: SettingsService;

  @apiMethod()
  getSettings(): ISettingsState {
    return this.settingsService.state;
  }

  @apiMethod()
  setSettings(ctx: IApiContext, settingsPatch: Partial<ISettingsState>) {
    this.settingsService.setSettingsPatch(settingsPatch);
  }
}
