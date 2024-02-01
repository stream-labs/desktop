import { CustomizationService as InternalCustomizationService } from 'services/customization';
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { Observable } from 'rxjs';
import { ISerializable } from 'services/api/rpc-api';
import pick from 'lodash/pick';

interface IPinnedStatistics {
  cpu: boolean;
  fps: boolean;
  droppedFrames: boolean;
  bandwidth: boolean;
}

interface ICustomizationServiceState {
  hideViewerCount: boolean;
  livedockCollapsed: boolean;
  performanceMode: boolean;
  chatZoomFactor: number;
  pinnedStatistics: IPinnedStatistics;
  theme: string;
}

interface ICustomizationServiceStateUpdateSettings {
  hideViewerCount?: boolean;
  livedockCollapsed?: boolean;
  performanceMode?: boolean;
}

/** API for getting and setting properties on the Customization service. */
@Singleton()
export class CustomizationService implements ISerializable {
  @Fallback()
  @Inject()
  private customizationService: InternalCustomizationService;

  /**
   * Observable event that is triggered whenever the customization settings
   * change.
   *
   * The value of this event are the settings that have changed and is
   * represented by {@link ICustomizationServiceState}.
   *
   * @see ICustomizationServiceState
   */
  get settingsChanged(): Observable<Partial<ICustomizationServiceState>> {
    return this.customizationService.settingsChanged;
  }

  /**
   * Returns the current settings state represented.
   *
   * @returns A serialized representation of {@link CustomizationService}
   *
   * @see {@link ICustomizationServiceState}
   */
  getModel(): ICustomizationServiceState {
    const state = this.customizationService.state;

    return pick(state, [
      'hideViewerCount',
      'livedockCollapsed',
      'performanceMode',
      'chatZoomFactor',
      'pinnedStatistics',
      'theme',
    ]);
  }

  /**
   * Update the customization settings
   *
   * @param settingsPatch Customization settings to update
   * @see {@link ICustomizationServiceStateUpdateSettings}
   */
  setSettings(settingsPatch: Partial<ICustomizationServiceStateUpdateSettings>) {
    const settings = pick(settingsPatch, [
      'hideViewerCount',
      'livedockCollapsed',
      'performanceMode',
    ]);

    this.customizationService.setSettings(settings);
  }
}
