import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ModalLayout from '../ModalLayout.vue';
import windowMixin from '../mixins/window';
import TextInput from '../shared/forms/TextInput.vue';
import ListInput from '../shared/forms/ListInput.vue';
import BoolInput from '../shared/forms/BoolInput.vue';
import { IFormInput, IListInputValue } from '../shared/forms/Input';
import { StreamInfoService } from '../../services/stream-info';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { debounce } from 'lodash';
import { getPlatformService } from '../../services/platforms';
import StreamingService from '../../services/streaming';
import { WindowsService } from '../../services/windows';
import { NavigationService } from '../../services/navigation';
import { CustomizationService } from '../../services/customization';

@Component({
  components: {
    ModalLayout,
    TextInput,
    ListInput,
    BoolInput
  },
  mixins: [windowMixin]
})
export default class EditStreamInfo extends Vue {

  @Inject() streamInfoService: StreamInfoService;
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;
  @Inject() windowsService: WindowsService;
  @Inject() navigationService: NavigationService;
  @Inject() customizationService: CustomizationService;


  // UI State Flags
  searchingGames = false;
  updatingInfo = false;
  updateError = false;


  // Form Models:

  streamTitleModel: IFormInput<string> = {
    name: 'stream_title',
    description: 'Title',
    value: ''
  };

  gameModel: IListInputValue = {
    name: 'stream_game',
    description: 'Game',
    value: '',
    options: []
  };


  doNotShowAgainModel: IFormInput<boolean> = {
    name: 'do_not_show_again',
    description: 'Do not show this message when going live',
    value: false
  };


  // Debounced Functions:
  debouncedGameSearch: (search: string) => void;


  created() {
    this.debouncedGameSearch = debounce((search: string) => this.onGameSearchChange(search), 500);

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
            this.gameModel.options.push({ description: game.name, value: game.name });
          });
        }
      });
    }
  }


  // For some reason, v-model doesn't work with ListInput
  onGameInput(gameModel: IListInputValue) {
    this.gameModel = gameModel;
  }


  updateAndGoLive() {
    this.updatingInfo = true;

    if (this.doNotShowAgainModel.value) {
      alert('You will not be asked again to update your stream info when going live.  ' +
        'You can re-enable this from the settings.');

      this.customizationService.setUpdateStreamInfoOnLive(false);
    }

    this.streamInfoService.setStreamInfo(
      this.streamTitleModel.value,
      this.gameModel.value
    ).then(success => {
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


  get submitText() {
    if (this.midStreamMode) return 'Update';

    return 'Confirm & Go Live';
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
