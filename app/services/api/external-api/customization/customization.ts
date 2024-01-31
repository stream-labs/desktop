import { CustomizationService as InternalCustomizationService } from 'services/customization';
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { Observable } from 'rxjs';
import { ISerializable } from 'services/api/rpc-api';

interface IPinnedStatistics {
  cpu: boolean;
  fps: boolean;
  droppedFrames: boolean;
  bandwidth: boolean;
}

interface ICustomizationServiceState {
  nightMode?: string;
  theme: string;
  updateStreamInfoOnLive: boolean;
  livePreviewEnabled: boolean;
  leftDock: boolean;
  hideViewerCount: boolean;
  folderSelection: boolean;
  legacyAlertbox: boolean | null;
  livedockCollapsed: boolean;
  livedockSize: number;
  eventsSize: number;
  controlsSize: number;
  performanceMode: boolean;
  chatZoomFactor: number;
  enableBTTVEmotes: boolean;
  enableFFZEmotes: boolean;
  mediaBackupOptOut: boolean;
  navigateToLiveOnStreamStart: boolean;
  experimental?: {
    volmetersFPSLimit?: number;
  };
  designerMode: boolean;
  legacyEvents: boolean;
  pinnedStatistics: IPinnedStatistics;
  enableCrashDumps: boolean;
  enableAnnouncements: boolean;
}

/** API for getting and setting properties on the Customization service. */
@Singleton()
export class CustomizationService implements ISerializable {
  @Fallback()
  @Inject()
  private internalCustomizationService: InternalCustomizationService;

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
    return this.internalCustomizationService.settingsChanged;
  }

  // TODO: do we want to expose entire state like this, we didn't get more specific requirements
  /**
   * Returns the current settings state represented.
   *
   * @returns A serialized representation of {@link CustomizationService}
   */
  getModel(): ICustomizationServiceState {
    const state = this.internalCustomizationService.state;

    return state;
  }

  /**
   * Update the customization settings
   *
   * @param settingsPatch Customization settings to update
   * @see {@link ICustomizationServiceState}
   */
  setSettings(settingsPatch: Partial<ICustomizationServiceState>) {
    this.internalCustomizationService.setSettings(settingsPatch);
  }
}
