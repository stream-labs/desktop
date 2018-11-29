import {
  IStreamEncoderSettings,
  QUALITY_ORDER,
  SettingsService,
  StreamEncoderSettingsService
} from 'services/settings';
import { StreamingService, EStreamingState } from 'services/streaming';
import { Inject } from '../../util/injector';
import { IEncoderProfile } from './definitions';
import { cloneDeep } from 'lodash';
import { camelize, handleErrors } from '../../util/requests';
import { UrlService } from '../hosts';
import { mutation } from 'services/stateful-service';
import { PersistentStatefulService } from 'services/persistent-stateful-service';

export * from './definitions';

/**
 SLOBS will send these information as inputs for the server
 - Current Bitrate
 - Current output resolution
 - Current game
 - Current video encoder
 - Profile choose by the users
 The server will return :
 - New output resolution
 - Presets and option for the video encoders
 Once SLOBS will receive these, the same behavior will be done :
 - We save the current settings
 - We apply the optimized settings depending on what the user choose
 - We start streaming
 - When the stream ends :
 - We remove the optimized settings
 - We apply the old settings
 We now support the x264 / QSV / NVENC encoders
 We're also doing some resolution switching
 */

export enum EPresetType {
  HIGH_PRERFORMANCE = 0,
  HIGH_QUALITY = 1
}

interface IVideoEncodingOptimizationServiceState {
  useOptimizedProfile: boolean,
  lastLoadedGame: string,
  lastLoadedProfiles: IEncoderProfile[],
  lastSelectedPreset: EPresetType;
}

export class VideoEncodingOptimizationService
  extends PersistentStatefulService<IVideoEncodingOptimizationServiceState> {

  static defaultState: IVideoEncodingOptimizationServiceState = {
    useOptimizedProfile: false,
    lastLoadedGame: '',
    lastLoadedProfiles: [],
    lastSelectedPreset: 0
  };

  private previousSettings: any;
  private isUsingEncodingOptimizations = false;

  @Inject() private settingsService: SettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private streamEncoderSettingsService: StreamEncoderSettingsService;
  @Inject() private urlService: UrlService;

  init() {
    super.init();
    this.streamingService.streamingStatusChange.subscribe(status => {
      if (
        status === EStreamingState.Offline &&
        this.isUsingEncodingOptimizations
      ) {
        this.isUsingEncodingOptimizations = false;
        this.restorePreviousValues();
      }
    });
  }

  /**
   * returns profiles according to the current encoder settings
   */
  async fetchProfilesForCurrentSettings(game: string): Promise<IEncoderProfile[]> {
    const settings = this.streamEncoderSettingsService.getSettings();
    const profiles = await this.fetchAvailableGameProfiles(game);
    if (!profiles.length) return [];

    let filteredProfiles = profiles.filter(profile => {
      return (
        profile.encoder === settings.encoder &&
        profile.bitrateMax >= settings.bitrate &&
        profile.bitrateMin <= settings.bitrate &&
        (!settings.preset || settings.preset == profile.presetIn)
      )
    });

    // find 2 profiles with the closest resolution
    const resInPx = resToPx(settings.outputResolution);
    const profilesResolutions = filteredProfiles
      .map((profile, ind) => {
        return {
          distance: Math.abs(resToPx(profile.resolutionIn) - resInPx),
          profile
        };
      });
    const [min1, min2] = profilesResolutions
      .sort((profile1, profile2) => profile1.distance - profile2.distance);
    filteredProfiles = [min1.profile, min2.profile];

    if (!filteredProfiles[0] || !filteredProfiles[1]) {
      console.error(new Error('2 profiles needed, got'), filteredProfiles);
      return [];
    }

    filteredProfiles = filteredProfiles.sort((profile1, profile2) => {
      return QUALITY_ORDER.indexOf(profile1.presetOut) - QUALITY_ORDER.indexOf(profile2.presetOut);
    });


    return filteredProfiles;
  }

  /**
   * returns profiles according to the game name
   */
  private async fetchAvailableGameProfiles(game: string): Promise<IEncoderProfile[]> {
    if (!game) return [];

    let profiles: IEncoderProfile[] = [];

    if (game == this.state.lastLoadedGame) {
      profiles = this.state.lastLoadedProfiles;
    } else {
      // try to fetch game-specific profile
      profiles = await fetch(this.urlService.getStreamlabsApi(`gamepresets/${game.toUpperCase()}`))
        .then(handleErrors)
        .then(camelize);
    }

    // if no game-specific profile found then fetch generic profiles
    if (!profiles.length) {
      profiles = await fetch(this.urlService.getStreamlabsApi('gamepresets/DEFAULT'))
        .then(handleErrors)
        .then(camelize);
    }

    this.CACHE_PROFILES(game, profiles);
    return profiles;
  }

  applyProfile(encoderProfile: IEncoderProfile, presetType: EPresetType) {
    this.previousSettings = cloneDeep(this.settingsService.getSettingsFormData('Output'));
    this.SAVE_LAST_SELECTED_PRESET(presetType);
    const currentSettings = this.streamEncoderSettingsService.getSettings();
    const newSettings: Partial<IStreamEncoderSettings> = {
      encoder: encoderProfile.encoder,
      mode: 'Advanced',
      encoderOptions: encoderProfile.options,
      preset: encoderProfile.presetOut,
      rescaleOutput: false // prevent using the rescaled resolution from encoder settings
    };

    if (!currentSettings.hasCustomResolution) {
      // change the resolution only if user didn't set a custom one
      newSettings.outputResolution = encoderProfile.resolutionOut
    }

    console.log('Apply encoder settings', newSettings);

    this.streamEncoderSettingsService.setSettings(newSettings);
    this.isUsingEncodingOptimizations = true;
  }

  canApplyProfileFromCache() {
    return !!(
      this.state.useOptimizedProfile &&
      this.state.lastSelectedPreset &&
      this.state.lastLoadedProfiles.length
    );
  }

  async applyProfileFromCache() {
    if (!this.canApplyProfileFromCache()) return;
    const profiles = await this.fetchProfilesForCurrentSettings(this.state.lastLoadedGame);
    this.applyProfile(profiles[this.state.lastSelectedPreset], this.state.lastSelectedPreset);
  }

  getIsUsingEncodingOptimizations() {
    return this.isUsingEncodingOptimizations;
  }

  useOptimizedProfile(enabled: boolean) {
    this.USE_OPTIMIZED_PROFILE(enabled);
  }

  private restorePreviousValues() {
    this.settingsService.setSettings('Output', this.previousSettings);
  }

  @mutation()
  private USE_OPTIMIZED_PROFILE(enabled: boolean) {
    this.state.useOptimizedProfile = enabled;
  }

  @mutation()
  private CACHE_PROFILES(game: string, profiles: IEncoderProfile[]) {
    this.state.lastLoadedGame = game;
    this.state.lastLoadedProfiles = profiles;
  }

  @mutation()
  private SAVE_LAST_SELECTED_PRESET(preset: number) {
    this.state.lastSelectedPreset = preset;
  }
}

function resToPx(res: string): number {
  return res
    .split('x')
    .map(px => Number(px))
    .reduce((prev, current) => prev * current);
}
