import { Service } from 'services/service';
import { SettingsService, StreamEncoderSettingsService } from 'services/settings';
import { StreamingService, EStreamingState } from 'services/streaming';
import { Inject } from '../../util/injector';
import { IEncoderProfile } from './definitions';
import { cloneDeep } from 'lodash';
import { camelize, handleErrors } from '../../util/requests';
import { UrlService } from '../hosts';
import { mutation, StatefulService } from '../stateful-service';
import { PersistentStatefulService } from '../persistent-stateful-service';

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

interface IVideoEncodingOptimizationServiceState {
  useOptimizedSettings: boolean,
  lastLoadedGame: string,
  lastLoadedProfiles: IEncoderProfile[],
  lastSelectedPreset: string;
}

export class VideoEncodingOptimizationService
  extends PersistentStatefulService<IVideoEncodingOptimizationServiceState> {

  static defaultState: IVideoEncodingOptimizationServiceState = {
    useOptimizedSettings: true,
    lastLoadedGame: '',
    lastLoadedProfiles: [],
    lastSelectedPreset: ''
  };

  private previousSettings: any;
  private isUsingEncodingOptimizations = false;

  @Inject() private settingsService: SettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private streamEncoderSettingsService: StreamEncoderSettingsService;
  @Inject() private urlService: UrlService;

  init() {
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
  async fetchGameProfiles(game: string): Promise<IEncoderProfile[]> {
    if (!game) return [];

    if (game == this.state.lastLoadedGame) {
      return this.state.lastLoadedProfiles;
    }

    // try to fetch game-specific profile
    let profiles: IEncoderProfile[] = await fetch(this.urlService.getStreamlabsApi(`gamepresets/${game.toUpperCase()}`))
      .then(handleErrors)
      .then(camelize);

    // if no game-specific profile found then fetch generic profiles
    if (!profiles.length) {
      profiles = await fetch(this.urlService.getStreamlabsApi('gamepresets/DEFAULT'))
        .then(handleErrors)
        .then(camelize);
    }

    const settings = this.streamEncoderSettingsService.getSettings();

    return profiles.filter(profile => {
      return (
        profile.encoder === settings.encoder &&
        profile.resolutionIn == settings.outputResolution &&
        profile.bitrateMax >= settings.bitrate &&
        profile.bitrateMin <= settings.bitrate &&
        (!settings.preset || (profile.presetIn == settings.preset))
      )
    });
  }

  applyProfile(encoderProfile: IEncoderProfile) {
    this.previousSettings = cloneDeep(this.settingsService.getSettingsFormData('Output'));
    this.streamEncoderSettingsService.setSettings({
      outputResolution: encoderProfile.resolutionOut,
      encoder: encoderProfile.encoder,
      mode: 'Advanced',
      encoderOptions: encoderProfile.options,
      preset: encoderProfile.presetOut
    });
    this.isUsingEncodingOptimizations = true;
  }

  restorePreviousValues() {
    this.settingsService.setSettings('Output', this.previousSettings);
  }

  getIsUsingEncodingOptimizations() {
    return this.isUsingEncodingOptimizations;
  }

  @mutation() USE_OPTIMIZED_SETTINGS(enabled: boolean) {
    this.state.useOptimizedSettings = enabled;
  }


  @mutation()
  private CACHE_PROFILES(game: string, profiles: IEncoderProfile[]) {
    this.state.lastLoadedGame = game;
    this.state.lastLoadedProfiles = profiles;
  }

  @mutation()
  private CACHE_PRESET(preset: string) {
    this.state.lastSelectedPreset = preset;
  }
}
