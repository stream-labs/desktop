import { Module, apiMethod, apiEvent, EApiPermissions } from './module';
import { Inject } from 'util/injector';
import { CustomizationService } from 'services/customization';
import { Subject } from 'rxjs';

enum ETheme {
  Day = 'day',
  Night = 'night'
}

export class ThemeModule extends Module {

  moduleName = 'Theme';
  permissions: EApiPermissions[] = [];

  @Inject() customizationService: CustomizationService;

  constructor() {
    super();

    this.customizationService.settingsChanged.subscribe(patch => {
      if (patch.nightMode != null) {
        this.themeChanged.next(patch.nightMode ? ETheme.Night : ETheme.Day);
      }
    });
  }

  @apiEvent()
  themeChanged = new Subject<ETheme>();


  @apiMethod()
  getTheme(): ETheme {
    return this.customizationService.nightMode ? ETheme.Night : ETheme.Day;
  }

}
