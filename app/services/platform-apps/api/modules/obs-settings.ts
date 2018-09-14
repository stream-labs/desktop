import { Module, EApiPermissions, apiMethod, IApiContext } from './module';
import { SettingsService, ISettingsState } from 'services/settings';
import { Inject } from 'util/injector';


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
    // Tech Debt: This is a product of our awful settings API.
    // We can clean all this up when we get off node-obs.
    // For now, I would rather do the data munging here than
    // force it on our app developers.
    Object.keys(settingsPatch).forEach(categoryName => {
      const category: Dictionary<any> = settingsPatch[categoryName];
      const formSubCategories = this.settingsService.getSettingsFormData(categoryName);

      Object.keys(category).forEach(paramName => {
        formSubCategories.forEach(subCategory => {
          subCategory.parameters.forEach(subCategoryParam => {
            if (subCategoryParam.name === paramName) {
              subCategoryParam.value = category[paramName];
            }
          });
        });
      });

      this.settingsService.setSettings(categoryName, formSubCategories);
    });
  }

}
