import { invert } from 'lodash';
import { Service } from 'services/service';
import { ISettingsSubCategory, SettingsService } from 'services/settings';
import { Inject } from 'util/injector';

export enum EEncoder {
  x264 = 'x264',
  qsv = 'qsv',
  nvenc = 'nvenc',
  amd = 'amd',
}

enum EObsEncoder {
  x264 = 'x264',
  obs_x264 = 'obs_x264',
  nvenc = 'nvenc',
  ffmpeg_nvenc = 'ffmpeg_nvenc',
  amd = 'amd',
  amd_amf_h264 = 'amd_amf_h264',
  qsv = 'qsv',
  obs_qsv11 = 'obs_qsv11',
}

enum EFileFormat {
  flv = 'flv',
  mp4 = 'mp4',
  mov = 'mov',
  mkv = 'mkv',
  ts = 'ts',
  m3u8 = 'm3u8',
}

export const QUALITY_ORDER = [
  // x264
  'ultrafast',
  'superfast',
  'veryfast',
  'faster',
  'fast',
  'medium',
  'slow',
  'slower',

  // NVENC
  'hp',
  'fast',
  'bd',
  'llhp',
  'default',
  'll',
  'llhq',
  'hq',
  'medium',
  'slow',
  'losslesshp',
  'lossless',

  // QSV
  'speed',
  'balanced',
  'quality',
];

export interface IOutputSettings {
  mode: TOutputSettingsMode;
  inputResolution: string;
  streaming: IStreamingEncoderSettings;
  recording: IRecordingEncoderSettings;
}

interface IOutputSettingsPatch {
  mode?: TOutputSettingsMode;
  streaming?: Partial<IStreamingEncoderSettings>;
  recording?: Partial<IRecordingEncoderSettings>;
}

export interface IEncoderSettings {
  encoder: EEncoder;
  outputResolution: string;
  bitrate: number;
}

export interface IRecordingEncoderSettings extends IEncoderSettings {
  path: string;
  format: EFileFormat;
}

export interface IStreamingEncoderSettings extends IEncoderSettings {
  preset: string;
  rescaleOutput: boolean;
  hasCustomResolution: boolean;
  encoderOptions: string;
}

type TOutputSettingsMode = 'Simple' | 'Advanced';

const simpleEncoderToAnvancedEncoderMap = {
  x264: 'obs_x264',
  x264_lowcpu: 'obs_x264',
  qsv: 'obs_qsv11',
  nvenc: 'ffmpeg_nvenc',
  amd: 'amd_amf_h264',
  jim_nvenc: 'jim_nvenc',
};

/**
 * each encoder have different set of fields
 */
export const encoderFieldsMap = {
  x264: { preset: 'preset', encoderOptions: 'x264opts' },
  nvenc: { preset: 'preset' },
  qsv: { preset: 'target_usage' },
  amd: { preset: 'QualityPreset' },
};

function simpleEncoderToAdvancedEncoder(encoder: EEncoder) {
  return simpleEncoderToAnvancedEncoderMap[encoder];
}

/**
 * returns a short encoder's name if exists
 */
export function obsEncoderToEncoder(obsEncoder: EObsEncoder): EEncoder {
  if (obsEncoder === 'obs_x264') return EEncoder.x264;
  const encoder = invert(simpleEncoderToAnvancedEncoderMap)[obsEncoder] || obsEncoder;
  return encoder as EEncoder;
}

export class OutputSettingsService extends Service {
  @Inject() private settingsService: SettingsService;

  /**
   * returns unified settings for the Streaming and Recording encoder
   * independently of selected mode
   */
  getSettings(): IOutputSettings {
    const output = this.settingsService.getSettingsFormData('Output');
    const video = this.settingsService.getSettingsFormData('Video');
    const mode: TOutputSettingsMode = this.settingsService.findSettingValue(
      output,
      'Untitled',
      'Mode',
    );

    const inputResolution: string = this.settingsService.findSettingValue(
      video,
      'Untitled',
      'Base',
    );

    const streaming = this.getStreamingEncoderSettings(output, video);
    const recording = this.getRecordingEncoderSettings(output, video, mode, streaming);

    return {
      mode,
      inputResolution,
      streaming,
      recording,
    };
  }

  private getStreamingEncoderSettings(
    output: ISettingsSubCategory[],
    video: ISettingsSubCategory[],
  ): IStreamingEncoderSettings {
    /**
     * Returns some information about the user's streaming settings.
     * This is used in aggregate to improve our optimized video encoding.
     *
     * P.S. Settings needs a refactor... badly
     */
    const encoder = obsEncoderToEncoder(
      this.settingsService.findSettingValue(output, 'Streaming', 'Encoder') ||
        this.settingsService.findSettingValue(output, 'Streaming', 'StreamEncoder'),
    ) as EEncoder;
    let preset: string;

    if (encoder === 'amd') {
      // The settings for AMD also have a Preset field but it's not what we need
      preset = [
        this.settingsService.findValidListValue(output, 'Streaming', 'QualityPreset'),
        this.settingsService.findValidListValue(output, 'Streaming', 'AMDPreset'),
      ].find(item => item !== void 0);
    } else {
      preset = [
        this.settingsService.findValidListValue(output, 'Streaming', 'preset'),
        this.settingsService.findValidListValue(output, 'Streaming', 'Preset'),
        this.settingsService.findValidListValue(output, 'Streaming', 'NVENCPreset'),
        this.settingsService.findValidListValue(output, 'Streaming', 'QSVPreset'),
        this.settingsService.findValidListValue(output, 'Streaming', 'target_usage'),
      ].find(item => item !== void 0);
    }

    const bitrate: number =
      this.settingsService.findSettingValue(output, 'Streaming', 'bitrate') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'VBitrate');
    const outputResolution: string =
      this.settingsService.findSettingValue(output, 'Streaming', 'RescaleRes') ||
      this.settingsService.findSettingValue(video, 'Untitled', 'Output');
    const encoderOptions =
      this.settingsService.findSettingValue(output, 'Streaming', 'x264Settings') ||
      this.settingsService.findSettingValue(output, 'Streaming', 'x264opts');
    const rescaleOutput = this.settingsService.findSettingValue(output, 'Streaming', 'Rescale');

    const resolutions = this.settingsService
      .findSetting(video, 'Untitled', 'Output')
      .options.map((option: any) => option.value);

    const hasCustomResolution = !resolutions.includes(outputResolution);

    return {
      encoder,
      preset,
      bitrate,
      outputResolution,
      encoderOptions,
      rescaleOutput,
      hasCustomResolution,
    };
  }

  private getRecordingEncoderSettings(
    output: ISettingsSubCategory[],
    video: ISettingsSubCategory[],
    mode: TOutputSettingsMode,
    streamingSettings: IStreamingEncoderSettings,
  ): IRecordingEncoderSettings {
    const path =
      mode === 'Simple'
        ? this.settingsService.findSettingValue(output, 'Recording', 'FilePath')
        : this.settingsService.findSettingValue(output, 'Recording', 'RecFilePath');

    const format = this.settingsService.findValidListValue(
      output,
      'Recording',
      'RecFormat',
    ) as EFileFormat;

    let encoder = obsEncoderToEncoder(
      this.settingsService.findSettingValue(output, 'Recording', 'RecEncoder'),
    ) as EEncoder;

    const outputResolution: string =
      this.settingsService.findSettingValue(output, 'Recording', 'RecRescaleRes') ||
      this.settingsService.findSettingValue(video, 'Untitled', 'Output');

    const quality = this.settingsService.findValidListValue(output, 'Recording', 'RecQuality');

    let bitrate: number;

    if (mode === 'Simple') {
      // convert Quality to Bitrate in the Simple mode
      switch (quality) {
        case 'Small':
          bitrate = 15000;
          break;
        case 'HQ':
          bitrate = 30000;
          break;
        case 'Lossless':
          bitrate = 80000;
          break;
        case 'Stream':
          bitrate = streamingSettings.bitrate;
          encoder = streamingSettings.encoder;
          break;
      }
    } else {
      this.settingsService.findSettingValue(output, 'Recording', 'Recbitrate');
    }

    return {
      path,
      format,
      encoder,
      outputResolution,
      bitrate,
    };
  }

  /**
   * This method helps to simplify tuning the encoder's settings
   * This method can patch ONLY Advanced settings
   */
  setSettings(settingsPatch: IOutputSettingsPatch) {
    if (settingsPatch.mode) {
      this.settingsService.setSettingValue('Output', 'Mode', settingsPatch.mode);
    }
    const currentSettings = this.getSettings();

    if (settingsPatch.streaming) {
      this.setStreamingEncoderSettings(currentSettings, settingsPatch.streaming);
    }

    if (settingsPatch.recording) {
      this.setRecordingEncoderSettings(currentSettings, settingsPatch.recording);
    }
  }

  private setStreamingEncoderSettings(
    currentSettings: IOutputSettings,
    settingsPatch: Partial<IStreamingEncoderSettings>,
  ) {
    if (settingsPatch.encoder) {
      if (currentSettings.mode === 'Advanced') {
        this.settingsService.setSettingValue(
          'Output',
          'Encoder',
          simpleEncoderToAdvancedEncoder(settingsPatch.encoder),
        );
      } else {
        this.settingsService.setSettingValue(
          'Output',
          'StreamEncoder',
          simpleEncoderToAdvancedEncoder(settingsPatch.encoder),
        );
      }
    }

    const encoder = settingsPatch.encoder || currentSettings.streaming.encoder;

    if (settingsPatch.outputResolution) {
      this.settingsService.setSettingValue('Video', 'Output', settingsPatch.outputResolution);
    }

    if (settingsPatch.preset) {
      this.settingsService.setSettingValue(
        'Output',
        encoderFieldsMap[encoder].preset,
        settingsPatch.preset,
      );
    }

    if (settingsPatch.encoderOptions !== void 0 && encoder === 'x264') {
      this.settingsService.setSettingValue(
        'Output',
        encoderFieldsMap[encoder].encoderOptions,
        settingsPatch.encoderOptions,
      );
    }

    if (settingsPatch.rescaleOutput !== void 0) {
      this.settingsService.setSettingValue('Output', 'Rescale', settingsPatch.rescaleOutput);
    }

    if (settingsPatch.bitrate !== void 0) {
      if (currentSettings.mode === 'Advanced') {
        this.settingsService.setSettingValue('Output', 'bitrate', settingsPatch.bitrate);
      } else {
        this.settingsService.setSettingValue('Output', 'VBitrate', settingsPatch.bitrate);
      }
    }
  }

  private setRecordingEncoderSettings(
    currentSettings: IOutputSettings,
    settingsPatch: Partial<IRecordingEncoderSettings>,
  ) {
    const mode = currentSettings.mode;
    if (settingsPatch.format) {
      this.settingsService.setSettingValue('Output', 'RecFormat', settingsPatch.format);
    }

    if (settingsPatch.path) {
      this.settingsService.setSettingValue(
        'Output',
        mode === 'Simple' ? 'FilePath' : 'RecFilePath',
        settingsPatch.path,
      );
    }

    if (settingsPatch.encoder) {
      this.settingsService.setSettingValue(
        'Output',
        'RecEncoder',
        simpleEncoderToAdvancedEncoder(settingsPatch.encoder),
      );
    }

    if (settingsPatch.bitrate) {
      this.settingsService.setSettingValue('Output', 'Recbitrate', settingsPatch.bitrate);
    }
  }
}
