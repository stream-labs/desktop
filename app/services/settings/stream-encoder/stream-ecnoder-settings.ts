import { invert, cloneDeep } from  'lodash';
import { Service } from 'services/service';
import { SettingsService } from 'services/settings';
import { Inject } from 'util/injector';

export type TEncoder = 'x264' | 'qsv' | 'nvenc';

export interface IStreamEncoderSettings {
  mode: 'Simple' | 'Advanced';
  encoder: TEncoder;
  bitrate: number;
  inputResolution: string;
  outputResolution: string;
  preset: string;
  encoderOptions: string;
}

/**
 * each encoder have different set of fields
 */
export const encoderFieldsMap = {
  x264: { preset: 'preset', encoderOptions: 'x264opts' },
  nvenc: { preset: 'NVENCPreset' },
  qsv: { preset: 'QSVPreset' }
};

const encoderToObsEncoderMap = {
  'x264': 'obs_x264',
  'qsv': 'obs_qsv11',
  'nvenc': 'ffmpeg_nvenc'
};

function encoderToObsEncoder(encoder: TEncoder) {
  return encoderToObsEncoderMap[encoder];
}

/**
 * returns a short encoder name if exists
 */
export function obsEncoderToEncoder(obsEncoder: string): TEncoder | string {
  return invert(encoderToObsEncoderMap)[obsEncoder] || obsEncoder;
}

export class StreamEncoderSettings extends Service {
  @Inject() private settingsService: SettingsService;

  /**
   * Returns some information about the user's streaming settings.
   * This is used in aggregate to improve our optimized video encoding.
   *
   * P.S. Settings needs a refactor... badly
   */
  getSettings(): IStreamEncoderSettings {
    const output = this.settingsService.getSettingsFormData('Output');
    const video = this.settingsService.getSettingsFormData('Video');

    const mode = this.settingsService.findSettingValue(output, 'Untitled', 'Mode');
    const encoder = obsEncoderToEncoder(
      this.settingsService.findSettingValue(output, 'Streaming', 'Encoder') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'StreamEncoder')
    ) as TEncoder;
    const preset: string = this.settingsService.findSettingValue(output, 'Streaming', 'preset') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'Preset') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'NVENCPreset') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'QSVPreset') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'target_usage') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'QualityPreset') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'AMDPreset');
    const bitrate: number = this.settingsService.findSettingValue(output, 'Streaming', 'bitrate') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'VBitrate');
    const inputResolution: string = this.settingsService.findSettingValue(video, 'Untitled', 'Base');
    const outputResolution: string = mode == 'Advanced' ?
      this.settingsService.findSettingValue(output, 'Streaming', 'RescaleRes') :
      this.settingsService.findSettingValue(video, 'Untitled', 'Output');
    const encoderOptions = this.settingsService.findSettingValue(output, 'Streaming', 'x264Settings') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'x264opts')


    return  {
      mode,
      encoder,
      preset,
      bitrate,
      inputResolution,
      outputResolution,
      encoderOptions
    };
  }


  setSettings(settingsPatch: Partial<IStreamEncoderSettings>) {
    if (settingsPatch.mode) this.settingsService.setSettingValue('Output', 'Mode', settingsPatch.mode);

    const currentSettings = this.getSettings();

    if (settingsPatch.encoder) {
      if (currentSettings.mode == 'Advanced') {
        this.settingsService.setSettingValue('Output', 'Encoder', encoderToObsEncoder(settingsPatch.encoder));
      } else {
        this.settingsService.setSettingValue('Output', 'StreamEncoder', encoderToObsEncoder(settingsPatch.encoder));
      }
    }

    const encoder = settingsPatch.encoder || currentSettings.encoder;

    if (settingsPatch.outputResolution) {
      this.settingsService.setSettingValue('Output', 'RescaleRes', settingsPatch.outputResolution);
    }

    if (settingsPatch.preset) {
      this.settingsService.setSettingValue('Output', encoderFieldsMap[encoder].preset, settingsPatch.preset);
    }

    if (settingsPatch.encoderOptions && encoder == 'x264') {
      this.settingsService.setSettingValue(
        'Output',
        encoderFieldsMap[encoder].encoderOptions,
        settingsPatch.encoderOptions
      );
    }
  }

}
