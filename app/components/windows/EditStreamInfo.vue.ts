import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ModalLayout from '../ModalLayout.vue';
import { ObsTextInput, ObsListInput, ObsBoolInput }from 'components/obs/inputs';
import { IObsInput, IObsListInput, IObsTextInputValue } from 'components/obs/inputs/ObsInput';
import { StreamInfoService } from 'services/stream-info';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { debounce } from 'lodash';
import { getPlatformService, IChannelInfo } from 'services/platforms';
import { StreamingService } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { NavigationService } from 'services/navigation';
import { CustomizationService } from 'services/customization';
import { Multiselect } from 'vue-multiselect';
import { $t } from 'services/i18n';
import {
  VideoEncodingOptimizationService,
  IEncoderPreset
} from 'services/video-encoding-optimizations';
import { IStreamlabsFacebookPage, IStreamlabsFacebookPages } from 'services/platforms/facebook';
import { shell } from 'electron';

interface IMultiSelectProfiles {
  value: IEncoderPreset;
  description: string;
  longDescription: string;
}

@Component({
  components: {
    ModalLayout,
    ObsTextInput,
    ObsListInput,
    ObsBoolInput,
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
  areAvailableProfiles = false;
  useOptimizedProfile = false;
  isGenericProfiles = false;
  hasPages = false;
  populatingModels = false;

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

  pageModel: IObsListInput<string> = {
    name: 'stream_page',
    description: $t('Facebook Page'),
    value: '',
    options: []
  };

  doNotShowAgainModel: IObsInput<boolean> = {
    name: 'do_not_show_again',
    description: $t('Do not show this message when going live'),
    value: false
  };

  encoderProfile: IMultiSelectProfiles;

  facebookPages: IStreamlabsFacebookPages;

  // Debounced Functions:
  debouncedGameSearch: (search: string) => void;

  async created() {
    this.debouncedGameSearch = debounce(
      (search: string) => this.onGameSearchChange(search),
      500
    );

    if (this.streamInfoService.state.channelInfo) {
      this.populatingModels = true;
      if (this.isFacebook) {
        const service = getPlatformService('facebook');
        await service.prepopulateInfo()
          .then((info: IChannelInfo) => {
            if (!info) return;
            this.streamInfoService.setStreamInfo(info.title, info.description, info.game)
          })
          .then(() => this.populateModels());
      } else {
        await this.populateModels();
      }
      this.populatingModels = false;
    } else {
      // If the stream info pre-fetch failed, we should try again now
      this.refreshStreamInfo();
    }
  }

  async populateModels() {
    this.facebookPages = await this.fetchFacebookPages();
    this.streamTitleModel.value = this.streamInfoService.state.channelInfo.title;
    this.gameModel.value = this.streamInfoService.state.channelInfo.game;
    this.streamDescriptionModel.value = this.streamInfoService.state.channelInfo.description;
    this.gameModel.options = [
      {
        description: this.streamInfoService.state.channelInfo.game,
        value: this.streamInfoService.state.channelInfo.game
      }
    ];

    if (this.facebookPages) {
      this.pageModel.value = this.facebookPages.page_id;
      this.pageModel.options = this.facebookPages.pages.map((page: IStreamlabsFacebookPage) => (
        { value: page.id, description: `${page.name} | ${page.category}` }
      ));
      this.hasPages = !!this.facebookPages.pages.length;
    }
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

  loadAvailableProfiles() {
    if (!this.midStreamMode) {
      const availableProfiles = this.videoEncodingOptimizationService.getGameProfiles(
        this.gameModel.value
      );

      const genericProfiles = this.videoEncodingOptimizationService.getGameProfiles(
        'Generic'
      );

      this.areAvailableProfiles = availableProfiles.length > 0 || genericProfiles.length > 0;

      if (this.areAvailableProfiles) {
        let profiles: IEncoderPreset[] = [];

        if (availableProfiles.length > 0) {
          profiles = availableProfiles;
          this.isGenericProfiles = false;
        } else {
          profiles = genericProfiles;
          this.isGenericProfiles = true;
        }

        this.encoderProfile = {
          value: profiles[0],
          description: profiles[0].profile.description,
          longDescription: profiles[0].profile.longDescription,
        };
      }
    }
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
      })
      .catch((e) => {
        this.$toasted.show(
          e,
          {
            position: 'bottom-center',
            className: 'toast-alert',
            duration: 1000,
            singleton: true
          }
        );
        this.updatingInfo = false;
      });

    if (this.areAvailableProfiles && this.useOptimizedProfile) {
      this.videoEncodingOptimizationService.applyProfile(
        this.encoderProfile.value
      );
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

  get isFacebook() {
    return this.userService.platform.type === 'facebook';
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

  fetchFacebookPages() {
    return this.userService.getFacebookPages();
  }

  setFacebookPageId(model: IObsListInput<string>) {
    this.userService.postFacebookPage(model.value);
  }

  openFBPageCreateLink() {
    shell.openExternal('https://www.facebook.com/pages/creation/');
    this.windowsService.closeChildWindow();
  }

  get profiles() {
    const multiselectArray: IMultiSelectProfiles[] = [];
    let profiles = this.videoEncodingOptimizationService.getGameProfiles(
      this.gameModel.value
    );
    if (profiles.length === 0) {
      profiles = this.videoEncodingOptimizationService.getGameProfiles(
        'Generic'
      );
    }
    profiles.forEach(profile => {
      multiselectArray.push({
        value: profile,
        description: profile.profile.description,
        longDescription: profile.profile.longDescription,
      });
    });
    return multiselectArray;
  }
}
