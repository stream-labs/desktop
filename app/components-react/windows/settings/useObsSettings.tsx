import React from 'react';
import { useModule } from '../../hooks/useModule';
import { mutation } from '../../store';
import { Services } from '../../service-provider';
import { ObsFormGroup } from '../../obs/ObsForm';
import { ISettingsSubCategory } from '../../../services/settings';

class ObsSettingsModule {
  state = {
    page: '',
  };

  init() {
    // init page
    const { WindowsService } = Services;
    if (WindowsService.state.child.queryParams) {
      this.state.page = WindowsService.state.child.queryParams.categoryName || 'General';
    } else {
      this.state.page = 'General';
    }
  }

  @mutation()
  setPage(page: string) {
    this.state.page = page;
  }

  private get settingsService() {
    return Services.SettingsService;
  }

  saveSettings(newSettings: ISettingsSubCategory[]) {
    console.log('save settings', this.state.page, newSettings);
    this.settingsService.setSettings(this.state.page, newSettings);
  }

  get settingsFormData() {
    return this.settingsService.state[this.state.page]?.formData ?? [];
  }
}

export function useObsSettings() {
  return useModule(ObsSettingsModule).select();
}
