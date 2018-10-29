import { Service } from 'services/service';
import { SettingsService, StreamEncoderSettings } from 'services/settings';
import { StreamingService, EStreamingState } from 'services/streaming';
import { Inject } from '../../util/injector';
import { IEncoderProfile } from './definitions';
import { cloneDeep } from 'lodash';
import { camelize, handleErrors } from '../../util/requests';
import { UrlService } from '../hosts';

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

 Encoder = x264
 BitrateMin =  0
 BitrateMax =  3
 preset = ultrafast
 resolution_in = 1920x1080
 resolution_out = 1920x1080
 options = nal-hrd=cbr:trellis=0:me=dia:force-cfr=1:deblock=’0:1:0’rc-lookahead=20:ref=0:chroma-qp-offset=-2:bframes=0:subme=0:b_adapt=1:mixed-refs=0:cabac=1:qpstep=4:b_pyramid=2:mbtree=0:chroma_me=1:psy=1:8x8dct=0:fast_pskip=1:lookahead_threads=6
 */

enum OutputMode {
  simple = 'Simple',
  advanced = 'Advanced'
}

export interface IOutputSettingsDeprecated {
  outputMode: OutputMode;
  encoderField: string;
  presetField: string;
  encoderSettingsField: string;
}

export class VideoEncodingOptimizationService extends Service {
  private previousSettings: any;
  private isUsingEncodingOptimizations = false;
  private currentOutputSettings: IOutputSettingsDeprecated;

  @Inject() settingsService: SettingsService;
  @Inject() streamingService: StreamingService;
  @Inject() streamEncoderSettings: StreamEncoderSettings;
  @Inject() urlService: UrlService;

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

    const profiles: IEncoderProfile[] =
      await fetch(this.urlService.getStreamlabsApi(`gamepresets/${game}`))
      .then(handleErrors)
      .then(camelize);

    const settings = this.streamEncoderSettings.getSettings();

    return profiles.filter(profile => {
      return (
        profile.encoder === settings.encoder &&
        profile.resolutionIn == settings.inputResolution &&
        profile.resolutionOut == settings.outputResolution &&
        profile.bitrateMax >= settings.bitrate &&
        profile.bitrateMin <= settings.bitrate
      )
    });
  }

  applyProfile(encoderProfile: IEncoderProfile) {
    this.previousSettings = cloneDeep(this.settingsService.getSettingsFormData('Output'));
    this.streamEncoderSettings.setSettings({
      outputResolution: encoderProfile.resolutionOut,
      inputResolution: encoderProfile.resolutionIn,
      encoder: encoderProfile.encoder,
      mode: 'Advanced',
      encoderOptions: encoderProfile.options,
      preset: encoderProfile.preset
    });
    this.isUsingEncodingOptimizations = true;
  }

  restorePreviousValues() {
    this.settingsService.setSettings('Output', this.previousSettings);
  }

  getIsUsingEncodingOptimizations() {
    return this.isUsingEncodingOptimizations;
  }

  getCurrentOutputSettings(): IOutputSettingsDeprecated {
    return this.currentOutputSettings;
  }
}
