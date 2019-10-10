import { Service } from 'services/core/service';
import { ISettingsSubCategory, SettingsService } from 'services/settings';
import { Inject } from 'services/core/injector';
import { mutation, PersistentStatefulService } from '../../core';
import { TObsFormData } from '../../../components/obs/inputs/ObsInput';

interface IStreamSettingsState {
  protectedModeEnabled: boolean;
}

export class StreamSettingsService extends PersistentStatefulService<IStreamSettingsState> {
  @Inject() private settingsService: SettingsService;

  static defaultState: IStreamSettingsState = {
    protectedModeEnabled: true,
  };

  getObsSettings(): ISettingsSubCategory[] {
    return this.settingsService.getSettingsFormData('Streaming');
  }

  setObsSettings(formData: ISettingsSubCategory[]) {
    this.settingsService.setSettings('Streaming', formData);
  }

  setProtectedMode(enabled: boolean) {
    this.SET_PROTECTED_MODE(enabled);
  }

  @mutation()
  private SET_PROTECTED_MODE(enabled: boolean) {
    this.state.protectedModeEnabled = enabled;
  }
}
