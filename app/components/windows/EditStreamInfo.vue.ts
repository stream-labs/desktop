import Vue from 'vue';
import moment from 'moment';
import { Component } from 'vue-property-decorator';
import ModalLayout from '../ModalLayout.vue';
import { ObsTextInput, ObsListInput } from 'components/obs/inputs';
import { BoolInput } from 'components/shared/inputs/inputs';
import { IObsInput, IObsListInput, IObsTextInputValue } from 'components/obs/inputs/ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
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
  IEncoderPreset,
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
    BoolInput,
    HFormGroup,
    Multiselect,
  },
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
    value: '',
  };

  streamDescriptionModel: IObsTextInputValue = {
    name: 'stream_description',
    description: 'Description',
    value: '',
    multiline: true,
  };

  gameModel: IObsListInput<string> = {
    name: 'stream_game',
    description: $t('Game'),
    value: '',
    options: [],
  };

  pageModel: IObsListInput<string> = {
    name: 'stream_page',
    description: $t('Facebook Page'),
    value: '',
    options: [],
  };

  doNotShowAgainModel: boolean = false;

  startTimeModel: { time: number; date: string } = {
    time: null,
    date: null,
  };

  encoderProfile: IMultiSelectProfiles;

  facebookPages: IStreamlabsFacebookPages;

  // Debounced Functions:
  debouncedGameSearch: (search: string) => void;

  async created() {
    this.debouncedGameSearch = debounce((search: string) => this.onGameSearchChange(search), 500);

    if (this.streamInfoService.state.channelInfo) {
      this.populatingModels = true;
      if (this.isFacebook || this.isYoutube) {
        const service = getPlatformService(this.userService.platform.type);
        await service
          .prepopulateInfo()
          .then((info: IChannelInfo) => {
            if (!info) return;
            return this.streamInfoService.setStreamInfo(info.title, info.description, info.game);
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
    this.gameModel.value = this.streamInfoService.state.channelInfo.game || '';
    this.streamDescriptionModel.value = this.streamInfoService.state.channelInfo.description;
    this.gameModel.options = [
      {
        description: this.streamInfoService.state.channelInfo.game,
        value: this.streamInfoService.state.channelInfo.game,
      },
    ];

    if (this.facebookPages) {
      this.pageModel.value = this.facebookPages.page_id;
      this.pageModel.options = this.facebookPages.pages.map((page: IStreamlabsFacebookPage) => ({
        value: page.id,
        description: `${page.name} | ${page.category}`,
      }));
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
              value: game.name,
            });
          });
        }
      });
    }
  }

  loadAvailableProfiles() {
    if (!this.midStreamMode) {
      const availableProfiles = this.videoEncodingOptimizationService.getGameProfiles(
        this.gameModel.value,
      );

      const genericProfiles = this.videoEncodingOptimizationService.getGameProfiles('Generic');

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

    if (this.doNotShowAgainModel) {
      alert(
        $t('You will not be asked again to update your stream info when going live. ') +
          $t('You can re-enable this from the settings.'),
      );

      this.customizationService.setUpdateStreamInfoOnLive(false);
    }

    this.streamInfoService
      .setStreamInfo(
        this.streamTitleModel.value,
        this.streamDescriptionModel.value,
        this.gameModel.value,
      )
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
      .catch(e => {
        this.$toasted.show(e, {
          position: 'bottom-center',
          className: 'toast-alert',
          duration: 1000,
          singleton: true,
        });
        this.updatingInfo = false;
      });

    if (this.areAvailableProfiles && this.useOptimizedProfile) {
      this.videoEncodingOptimizationService.applyProfile(this.encoderProfile.value);
    }
  }

  async scheduleStream() {
    this.updatingInfo = true;

    const scheduledStartTime = this.formatDateString();
    const service = getPlatformService(this.userService.platform.type);
    const streamInfo = {
      title: this.streamTitleModel.value,
      description: this.streamDescriptionModel.value,
      game: this.gameModel.value,
    };
    if (scheduledStartTime) {
      await service
        .scheduleStream(scheduledStartTime, streamInfo)
        .then(() => (this.startTimeModel = { time: null, date: null }))
        .then(() => {
          this.$toasted.show(
            $t(
              'Your stream has been scheduled for %{time} from now.' +
                " If you'd like to make another schedule please enter a different time",
              { time: moment().to(scheduledStartTime, true) },
            ),
            {
              position: 'bottom-center',
              fullWidth: true,
              className: 'toast-success toast-success__schedule',
              duration: 0,
              action: {
                text: $t('Close'),
                class: 'toast-action',
                onClick: (_e, toastedObject) => toastedObject.goAway(),
              },
            },
          );
        })
        .catch(e => {
          this.$toasted.show(e.error.message, {
            position: 'bottom-center',
            className: 'toast-alert',
            duration: 1000,
            singleton: true,
          });
        });
    }

    this.updatingInfo = false;
  }

  handleSubmit() {
    if (this.isSchedule) return this.scheduleStream();
    this.updateAndGoLive();
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
    if (this.midStreamMode) return $t('Update');
    if (this.isSchedule) return $t('Schedule');

    return $t('Confirm & Go Live');
  }

  get midStreamMode() {
    return this.streamingService.isStreaming;
  }

  get isSchedule() {
    return this.windowsService.getChildWindowQueryParams().isSchedule;
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

  get dateMetadata() {
    return {
      title: $t('Scheduled Date'),
      dateFormat: 'MM/DD/YYYY',
      placeholder: 'MM/DD/YYYY',
      description: this.isFacebook
        ? $t(
            'Please schedule no further than 7 days in advance and no sooner than 10 minutes in advance.',
          )
        : undefined,
    };
  }

  get timeMetadata() {
    return { title: $t('Scheduled Time'), format: 'hm', max: 24 * 3600 };
  }

  get profiles() {
    const multiselectArray: IMultiSelectProfiles[] = [];
    let profiles = this.videoEncodingOptimizationService.getGameProfiles(this.gameModel.value);
    if (profiles.length === 0) {
      profiles = this.videoEncodingOptimizationService.getGameProfiles('Generic');
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

  private formatDateString() {
    try {
      const dateArray = this.startTimeModel.date.split('/');
      let hours: string | number = Math.floor(this.startTimeModel.time / 3600);
      hours = hours < 10 ? `0${hours}` : hours;
      let minutes: string | number = (this.startTimeModel.time % 3600) / 60;
      minutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${dateArray[2]}-${dateArray[0]}-${
        dateArray[1]
      }T${hours}:${minutes}:00.0${moment().format('Z')}`;
    } catch {
      this.$toasted.show($t('Please enter a valid date'), {
        position: 'bottom-center',
        className: 'toast-alert',
        duration: 1000,
        singleton: true,
      });
    }
  }
}
