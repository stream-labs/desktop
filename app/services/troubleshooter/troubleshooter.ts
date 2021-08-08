import { mutation } from '../core/stateful-service';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { IObsInput, IObsNumberInputValue, TObsFormData } from 'components/obs/inputs/ObsInput';
import {
  ITroubleshooterServiceApi,
  ITroubleshooterSettings,
  TIssueCode,
} from './troubleshooter-api';
import { WindowsService } from 'services/windows';
import { Inject } from '../core/injector';
import { $t } from 'services/i18n';

interface ITroubleshooterState {
  settings: ITroubleshooterSettings;
}

export class TroubleshooterService
  extends PersistentStatefulService<ITroubleshooterState>
  implements ITroubleshooterServiceApi {
  static defaultState: ITroubleshooterState = {
    settings: {
      skippedEnabled: true,
      skippedThreshold: 0.25,
      laggedEnabled: false,
      laggedThreshold: 0.25,
      droppedEnabled: true,
      droppedThreshold: 0.25,
    },
  };

  @Inject() private windowsService: WindowsService;

  getSettings(): ITroubleshooterSettings {
    return this.state.settings;
  }

  setSettings(settingsPatch: Partial<ITroubleshooterSettings>) {
    this.SET_SETTINGS(settingsPatch);
  }

  restoreDefaultSettings() {
    this.setSettings(TroubleshooterService.defaultState.settings);
  }

  showTroubleshooter(issueCode: TIssueCode) {
    this.windowsService.showWindow({
      componentName: 'Troubleshooter',
      title: $t('Troubleshooter'),
      queryParams: { issueCode },
      size: {
        width: 500,
        height: 500,
      },
    });
  }

  @mutation()
  private SET_SETTINGS(settingsPatch: Partial<ITroubleshooterSettings>) {
    this.state.settings = { ...this.state.settings, ...settingsPatch };
  }
}
