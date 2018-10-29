import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import ModalLayout from '../ModalLayout.vue';
import { ObsTextInput, ObsListInput, ObsBoolInput }from 'components/obs/inputs';
import { IObsInput, IObsListInput, IObsTextInputValue } from 'components/obs/inputs/ObsInput';
import { StreamInfoService } from 'services/stream-info';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { debounce } from 'lodash';
import { getPlatformService } from 'services/platforms';
import { StreamingService } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { NavigationService } from 'services/navigation';
import { CustomizationService } from 'services/customization';
import { Multiselect } from 'vue-multiselect';
import { $t } from 'services/i18n';
import {
  VideoEncodingOptimizationService,
  IEncoderPresetDeprecated, IEncoderProfile
} from 'services/video-encoding-optimizations';
import { IListMetadata } from 'components/shared/inputs';
import FormInput from 'components/shared/inputs/FormInput.vue';

interface IMultiSelectProfiles {
  value: IEncoderPresetDeprecated;
  description: string;
  longDescription: string;
}

@Component({
  components: {
    ModalLayout,
    ObsTextInput,
    ObsListInput,
    ObsBoolInput,
    FormInput,
    Multiselect
  }
})
export default class EditStreamInfo extends Vue {
  @Inject() streamInfoService: StreamInfoService;
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;
  @Inject() windowsService: WindowsService;
  @Inject() navigationService: NavigationService;
  @Inject() customizationService: CustomizationService;
  @Inject() videoEncodingOptimizationService: VideoEncodingOptimizationService;

  // UI State Flags
  searchingGames = false;
  updatingInfo = false;
  updateError = false;
  useOptimizedProfile = false;
  selectedPresetType: string = '';

  @Watch('selectedPresetType')
  onSelectChange(value: string) {
    console.log('selection changed', value);
  }

  // Form Models:

  streamTitleModel: IObsInput<string> = {
    name: 'stream_title',
    description: $t('Title'),
    value: ''
  };

  streamDescriptionModel: IObsTextInputValue = {
    name: 'stream_description',
    description: 'Description',
    value: '',
    multiline: true
  };

  gameModel: IObsListInput<string> = {
    name: 'stream_game',
    description: $t('Game'),
    value: '',
    options: []
  };

  doNotShowAgainModel: IObsInput<boolean> = {
    name: 'do_not_show_again',
    description: $t('Do not show this message when going live'),
    value: false
  };

  encoderPresets: IEncoderProfile[] = [];

  // Debounced Functions:
  debouncedGameSearch: (search: string) => void;

  get isGenericProfiles() {
    return this.encoderPresets.length && this.encoderPresets[0].game == 'Generic';
  }

  get hasAvalablePresets() {
    return !!this.encoderPresets.length;
  }

  get selectedPreset() {
    return this.encoderPresets.find(preset => preset.preset === this.selectedPresetType);
  }

  created() {
    this.debouncedGameSearch = debounce(
      (search: string) => this.onGameSearchChange(search),
      500
    );

    if (this.streamInfoService.state.channelInfo) {
      this.populateModels();
    } else {
      // If the stream info pre-fetch failed, we should try again now
      this.refreshStreamInfo();
    }
  }

  populateModels() {
    this.streamTitleModel.value = this.streamInfoService.state.channelInfo.title;
    this.gameModel.value = this.streamInfoService.state.channelInfo.game;
    this.gameModel.options = [
      {
        description: this.streamInfoService.state.channelInfo.game,
        value: this.streamInfoService.state.channelInfo.game
      }
    ];
    this.loadAvailableProfiles();
  }

  onGameSearchChange(searchString: string) {
    if (searchString !== '') {
      this.searchingGames = true;
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);

      this.gameModel.options = [];

      service.searchGames(searchString).then(games => {
        this.searchingGames = false;
        if (games && games.length) {
          games.forEach(game => {
            this.gameModel.options.push({
              description: game.name,
              value: game.name
            });
          });
        }
      });
    }
  }

  async loadAvailableProfiles() {
    if (this.midStreamMode) return;
    this.encoderPresets = [];
    this.encoderPresets = await this.videoEncodingOptimizationService.fetchGameProfiles(this.gameModel.value);
    this.selectedPresetType = this.encoderPresets[0] && this.encoderPresets[0].preset || '';
  }

  get presetInputMetadata(): IListMetadata<string> {
    let options = this.encoderPresets.map((preset, index) => {
      return {
        value: preset.preset,
        title: `${preset.game} ${preset.encoder} (${preset.preset})`
      }
    });
    return { options };
  }

  // For some reason, v-model doesn't work with ListInput
  onGameInput(gameModel: IObsListInput<string>) {
    this.gameModel = gameModel;

    this.loadAvailableProfiles();
  }

  updateAndGoLive() {
    this.updatingInfo = true;

    if (this.doNotShowAgainModel.value) {
      alert(
        $t('You will not be asked again to update your stream info when going live.  ') +
        $t('You can re-enable this from the settings.')
      );

      this.customizationService.setUpdateStreamInfoOnLive(false);
    }

    this.streamInfoService
      .setStreamInfo(this.streamTitleModel.value, this.streamDescriptionModel.value, this.gameModel.value)
      .then(success => {
        if (success) {
          if (this.midStreamMode) {
            this.windowsService.closeChildWindow();
          } else {
            this.goLive();
          }
        } else {
          this.updateError = true;
          this.updatingInfo = false;
        }
      });

    if (this.hasAvalablePresets && this.useOptimizedProfile) {
      this.videoEncodingOptimizationService.applyProfile(this.selectedPreset);
    }
  }

  goLive() {
    this.streamingService.startStreaming();
    this.navigationService.navigate('Live');
    this.windowsService.closeChildWindow();
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }

  // This should have been pre-fetched, but we can force a refresh
  refreshStreamInfo() {
    this.streamInfoService.refreshStreamInfo().then(() => {
      if (this.streamInfoService.state.channelInfo) this.populateModels();
    });
  }

  get isTwitch() {
    return this.userService.platform.type === 'twitch';
  }

  get isYoutube() {
    return this.userService.platform.type === 'youtube';
  }

  get isMixer() {
    return this.userService.platform.type === 'mixer';
  }

  get submitText() {
    if (this.midStreamMode) return 'Update';

    return $t('Confirm & Go Live');
  }

  get midStreamMode() {
    return this.streamingService.isStreaming;
  }

  get infoLoading() {
    return this.streamInfoService.state.fetching;
  }

  get infoError() {
    return this.streamInfoService.state.error;
  }
}
