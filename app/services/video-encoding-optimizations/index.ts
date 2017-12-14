import { Service } from 'services/service';
import { SettingsService, ISettingsSubCategory } from 'services/settings';
import { StreamingService } from 'services/streaming';
import { Inject } from '../../util/injector';
import { IProfile, IEncoderPreset, getPreset } from './definitions';

const cloneDeep = require('lodash.clonedeep');

let previousSettings: any;
let isUsingEncodingOptimizations: boolean = false;

export class VideoEncodingOptimizationService extends Service {
  @Inject() settingsService: SettingsService;
  @Inject() streamingService: StreamingService;

  init() {
    this.streamingService.streamingStatusChange.subscribe(
        status => {
          if (!status) {
            isUsingEncodingOptimizations = false;
            this.restorePreviousValues();
          }
        }
      );
  }

  getGameProfiles(game: string): IEncoderPreset[] {
    return getPreset().filter(profile => {
      return profile.game === game;
    });
  }

  applyProfile (encoderPreset: IEncoderPreset) {
    let outputSettings = this.settingsService.getSettingsFormData('Output');

    let indexSubCategory =
    outputSettings.indexOf(outputSettings.find(category => {
      return category.nameSubCategory ===  'Streaming';
    }));

    let parameters = outputSettings[indexSubCategory].parameters;

    // Setting stream encoder value
    const indexStreamEncoder = parameters.indexOf(parameters.find(parameter => {
      return parameter.name === 'StreamEncoder';
    }));
    outputSettings[indexSubCategory].parameters[indexStreamEncoder].value = 'obs_x264';

    // Setting use advanced value
    const indexUseAdvanced = parameters.indexOf(parameters.find(parameter => {
      return parameter.name === 'UseAdvanced';
    }));
    outputSettings[indexSubCategory].parameters[indexUseAdvanced].value = true;

    // Apply these first settings to be able to set the next ones :
    // (Preset and x264Settings)
    this.settingsService.setSettings('Output', outputSettings);
    outputSettings = this.settingsService.getSettingsFormData('Output');
    previousSettings = cloneDeep(outputSettings);

    indexSubCategory =
    outputSettings.indexOf(outputSettings.find(category => {
      return category.nameSubCategory ===  'Streaming';
    }));

    parameters = outputSettings[indexSubCategory].parameters;

    // Setting preset value
    const indexPreset = parameters.indexOf(parameters.find(parameter => {
      return parameter.name === 'Preset';
    }));
    outputSettings[indexSubCategory].parameters[indexPreset].value = encoderPreset.profile.preset;

    // Setting encoder settings value
    const indexX264Settings = parameters.indexOf(parameters.find(parameter => {
      return parameter.name === 'x264Settings';
    }));
    outputSettings[indexSubCategory].parameters[indexX264Settings].value = encoderPreset.settings;

    this.settingsService.setSettings('Output', outputSettings);

    isUsingEncodingOptimizations = true;
  }

  restorePreviousValues () {
    this.settingsService.setSettings('Output', previousSettings);
  }

  isUsingEncodingOptimizations () {
    return isUsingEncodingOptimizations;
  }
}


