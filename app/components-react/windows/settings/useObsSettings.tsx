import React from 'react';
import { useModule, injectState, TModuleInstanceFor } from 'slap';
import { mutation } from '../../store';
import { Services } from '../../service-provider';
import { ISettingsSubCategory } from '../../../services/settings';

/**
 * A module for components in the SettingsWindow
 */
class ObsSettingsModule {
  state = injectState({
    page: '',
  });

  init() {
    // init page
    const { WindowsService } = Services;
    if (WindowsService.state.child.queryParams) {
      this.state.page = WindowsService.state.child.queryParams.categoryName || 'General';
    } else {
      this.state.page = 'General';
    }

    //
    // type GetUseModuleResult<TModuleConfig> = TModuleConfig & {
    //   extend: <TNewProps>(newPropsFactory: (props: TModuleConfig) => TNewProps) => TNewProps
    // }
    //
    // class MyModule {
    //   foo: 1;
    //   bar: 2;
    // }
    //
    // const mBase1 = null as any as GetUseModuleResult<MyModule>;
    // let { zoom2 } = useModule(MyModule).extend(() => ({
    //   zoom2: 2,
    // }));
    //
    // zoom2 = '2';
    //
    // let { zoom } = mBase1.extend(m => ({
    //   zoom: 1,
    // }));
    //
    // zoom = '1';

  }

  // @mutation()
  // setPage(page: string) {
  //   this.state.page = page;
  // }

  private get settingsService() {
    return Services.SettingsService;
  }

  saveSettings(newSettings: ISettingsSubCategory[]) {
    this.settingsService.setSettings(this.state.page, newSettings);
  }

  get settingsFormData() {
    return this.settingsService.state[this.state.page]?.formData ?? [];
  }
}

// wrap the module in a hook
export function useObsSettings() {
  return useModule(ObsSettingsModule);
}
