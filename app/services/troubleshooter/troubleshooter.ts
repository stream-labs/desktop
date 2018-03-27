import { mutation } from '../stateful-service';
import { PersistentStatefulService } from 'services/persistent-stateful-service';
import { IFormInput, INumberInputValue, TFormData } from '../../components/shared/forms/Input';
import { ITroubleshooterServiceApi, ITroubleshooterSettings, TIssueCode } from './troubleshooter-api';
import { WindowsService } from 'services/windows';
import { Inject } from '../../util/injector';


interface ITroubleshooterState {
  settings: ITroubleshooterSettings;
}


export class TroubleshooterService
  extends PersistentStatefulService<ITroubleshooterState>
  implements ITroubleshooterServiceApi
{

  static defaultState: ITroubleshooterState = {
    settings: {
      skippedEnabled: true,
      skippedThreshold: 0.15,
      laggedEnabled: false,
      laggedThreshold: 0.15,
      droppedEnabled: true,
      droppedThreshold: 0.1,
    }
  };

  @Inject() private windowsService: WindowsService;

  getSettings(): ITroubleshooterSettings  {
    return this.state.settings;
  }

  getSettingsFormData(): TFormData {

    const settings = this.state.settings;

    return [
      <IFormInput<boolean>> {
        value: settings.skippedEnabled,
        name: 'skippedEnabled',
        description: 'Detect skipped frames',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <INumberInputValue> {
        value: settings.skippedThreshold,
        name: 'skippedThreshold',
        description: 'Skipped frames threshold',
        type: 'OBS_PROPERTY_SLIDER',
        minVal: 0,
        maxVal: 1,
        stepVal: 0.01,
        visible: settings.skippedEnabled,
        enabled: true,
        usePercentages: true,
      },

      <IFormInput<boolean>> {
        value: settings.laggedEnabled,
        name: 'laggedEnabled',
        description: 'Detect lagged frames',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <INumberInputValue> {
        value: settings.laggedThreshold,
        name: 'laggedThreshold',
        description: 'Lagged frames threshold',
        type: 'OBS_PROPERTY_SLIDER',
        minVal: 0,
        maxVal: 1,
        stepVal: 0.01,
        visible: settings.laggedEnabled,
        enabled: true,
        usePercentages: true,
      },

      <IFormInput<boolean>> {
        value: settings.droppedEnabled,
        name: 'droppedEnabled',
        description: 'Detect dropped frames',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <INumberInputValue> {
        value: settings.droppedThreshold,
        name: 'droppedThreshold',
        description: 'Dropped frames threshold',
        type: 'OBS_PROPERTY_SLIDER',
        minVal: 0,
        maxVal: 1,
        stepVal: 0.01,
        visible: settings.droppedEnabled,
        enabled: true,
        usePercentages: true,
      }
    ];

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
      queryParams: { issueCode },
      size: {
        width: 500,
        height: 500
      }
    });
  }

  @mutation()
  private SET_SETTINGS(settingsPatch: Partial<ITroubleshooterSettings>) {
    this.state.settings = { ...this.state.settings, ...settingsPatch };
  }

}
