import { Service } from 'services/core/service';
import { SettingsService, ISettingsSubCategory } from 'services/settings';
import { StreamingService, EStreamingState } from 'services/streaming';
import { Inject } from '../core/injector';
import { IProfile, IEncoderPreset, Presets } from './definitions';
import { cloneDeep } from 'lodash';

export * from './definitions';

enum OutputMode {
  simple = 'Simple',
  advanced = 'Advanced',
}

export interface IOutputSettings {
  outputMode: OutputMode;
  encoderField: string;
  presetField: string;
  encoderSettingsField: string;
}

export class VideoEncodingOptimizationService extends Service {
  private previousSettings: any;
  private isUsingEncodingOptimizations = false;

  private simpleOutputSettings: IOutputSettings = {
    outputMode: OutputMode.simple,
    encoderField: 'StreamEncoder',
    presetField: 'Preset',
    encoderSettingsField: 'x264Settings',
  };

  private advancedOutputSettings: IOutputSettings = {
    outputMode: OutputMode.advanced,
    encoderField: 'Encoder',
    presetField: 'preset',
    encoderSettingsField: 'x264opts',
  };

  private currentOutputSettings: IOutputSettings;

  @Inject() settingsService: SettingsService;
  @Inject() streamingService: StreamingService;

  init() {
    this.streamingService.streamingStatusChange.subscribe(status => {
      if (status === EStreamingState.Offline && this.isUsingEncodingOptimizations) {
        this.isUsingEncodingOptimizations = false;
        this.restorePreviousValues();
      }
    });
  }

  getGameProfiles(game: string): IEncoderPreset[] {
    let profiles: IEncoderPreset[] = [];

    const outputSettings = this.settingsService.getSettingsFormData('Output');

    const generalOutputSettings = outputSettings.find(category => {
      return category.nameSubCategory === 'Untitled';
    });

    const mode = generalOutputSettings.parameters.find(parameter => {
      return parameter.name === 'Mode';
    });

    if (mode.value === 'Simple') {
      this.currentOutputSettings = this.simpleOutputSettings;
    } else if (mode.value === 'Advanced') {
      this.currentOutputSettings = this.advancedOutputSettings;
    }

    if (this.currentOutputSettings) {
      const subCategory = outputSettings.find(category => {
        return category.nameSubCategory === 'Streaming';
      });

      const StreamEncoder = subCategory.parameters.find(parameter => {
        return parameter.name === this.currentOutputSettings.encoderField;
      });

      profiles = Presets.filter(profile => {
        return (
          profile.game === game &&
          profile.encoder.find(encoder => {
            return encoder === StreamEncoder.value;
          })
        );
      });
    }

    return profiles;
  }

  applyProfile(encoderPreset: IEncoderPreset) {
    let outputSettings = this.settingsService.getSettingsFormData('Output');

    let indexSubCategory = outputSettings.indexOf(
      outputSettings.find(category => {
        return category.nameSubCategory === 'Streaming';
      }),
    );

    let parameters = outputSettings[indexSubCategory].parameters;

    // Setting stream encoder value
    const indexStreamEncoder = parameters.indexOf(
      parameters.find(parameter => {
        return parameter.name === this.currentOutputSettings.encoderField;
      }),
    );
    outputSettings[indexSubCategory].parameters[indexStreamEncoder].value = 'obs_x264';

    if (this.currentOutputSettings.outputMode === 'Simple') {
      // Setting use advanced value
      const indexUseAdvanced = parameters.indexOf(
        parameters.find(parameter => {
          return parameter.name === 'UseAdvanced';
        }),
      );
      outputSettings[indexSubCategory].parameters[indexUseAdvanced].value = true;
    }

    // Apply these first settings to be able to set the next ones :
    // (Preset and x264Settings)
    this.settingsService.setSettings('Output', outputSettings);
    outputSettings = this.settingsService.getSettingsFormData('Output');
    this.previousSettings = cloneDeep(outputSettings);

    indexSubCategory = outputSettings.indexOf(
      outputSettings.find(category => {
        return category.nameSubCategory === 'Streaming';
      }),
    );

    parameters = outputSettings[indexSubCategory].parameters;

    // Setting preset value
    const indexPreset = parameters.indexOf(
      parameters.find(parameter => {
        return parameter.name === this.currentOutputSettings.presetField;
      }),
    );
    outputSettings[indexSubCategory].parameters[indexPreset].value = encoderPreset.profile.preset;

    // Setting encoder settings value
    const indexX264Settings = parameters.indexOf(
      parameters.find(parameter => {
        return parameter.name === this.currentOutputSettings.encoderSettingsField;
      }),
    );
    outputSettings[indexSubCategory].parameters[indexX264Settings].value = encoderPreset.settings;

    this.settingsService.setSettings('Output', outputSettings);

    this.isUsingEncodingOptimizations = true;
  }

  restorePreviousValues() {
    this.settingsService.setSettings('Output', this.previousSettings);
  }

  getIsUsingEncodingOptimizations() {
    return this.isUsingEncodingOptimizations;
  }

  getCurrentOutputSettings(): IOutputSettings {
    return this.currentOutputSettings;
  }
}
