import Vue from 'vue';
import moment from 'moment';
import { Component } from 'vue-property-decorator';
import ModalLayout from '../ModalLayout.vue';
import { BoolInput, ListInput } from 'components/shared/inputs/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { StreamInfoService } from 'services/stream-info';
import { UserService } from '../../services/user';
import { Inject } from '../../util/injector';
import { debounce } from 'lodash';
import { getPlatformService, IChannelInfo } from 'services/platforms';
import { StreamingService } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import { $t, I18nService } from 'services/i18n';
import { IStreamlabsFacebookPage, IStreamlabsFacebookPages } from 'services/platforms/facebook';
import {
  VideoEncodingOptimizationService,
  IEncoderProfile,
} from 'services/video-encoding-optimizations';
import { shell } from 'electron';
import { IListOption } from '../shared/inputs';
import TwitchTagsInput from 'components/shared/inputs/TwitchTagsInput.vue';
import { TwitchService } from 'services/platforms/twitch';
import { prepareOptions, TTwitchTag, TTwitchTagWithLabel } from 'services/platforms/twitch/tags';

@Component({
  components: {
    ModalLayout,
    HFormGroup,
    BoolInput,
    ListInput,
    TwitchTagsInput,
  },
})
export default class EditStreamInfo extends Vue {
  @Inject() streamInfoService: StreamInfoService;
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;
  @Inject() windowsService: WindowsService;
  @Inject() customizationService: CustomizationService;
  @Inject() videoEncodingOptimizationService: VideoEncodingOptimizationService;
  @Inject() twitchService: TwitchService;
  @Inject() i18nService: I18nService;

  // UI State Flags
  searchingGames = false;
  updatingInfo = false;
  updateError = false;
  selectedProfile: IEncoderProfile = null;
  hasPages = false;
  populatingModels = false;

  // Form Models:

  streamTitleModel: string = '';

  streamDescriptionModel: string = '';

  gameModel: string = '';
  gameOptions: IListOption<string>[] = [];

  pageModel: string = '';
  pageOptions: IListOption<string>[] = [];

  doNotShowAgainModel: boolean = false;

  startTimeModel: { time: number; date: string } = {
    time: null,
    date: null,
  };

  facebookPages: IStreamlabsFacebookPages;

  // Debounced Functions:
  debouncedGameSearch: (search: string) => void;

  searchProfilesPending = false;

  allTwitchTags: TTwitchTag[] = null;

  twitchTags: TTwitchTagWithLabel[] = null;

  hasUpdateTagsPermission: boolean = true;

  get useOptimizedProfile() {
    return this.videoEncodingOptimizationService.state.useOptimizedProfile;
  }

  set useOptimizedProfile(enabled: boolean) {
    this.videoEncodingOptimizationService.useOptimizedProfile(enabled);
  }

  async created() {
    this.debouncedGameSearch = debounce((search: string) => this.onGameSearchChange(search), 500);

    this.streamInfoService.streamInfoChanged.subscribe(() => {
      if (this.isTwitch && this.streamInfoService.state.channelInfo) {
        if (!this.allTwitchTags && !this.twitchTags) {
          this.allTwitchTags = this.streamInfoService.state.channelInfo.availableTags;
          this.twitchTags = prepareOptions(
            this.i18nService.state.locale || this.i18nService.getFallbackLocale(),
            this.streamInfoService.state.channelInfo.tags,
          );
        }
      }
    });

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

    if (this.isTwitch && this.streamInfoService.state.channelInfo) {
      this.twitchService
        .hasScope('user:edit:broadcast')
        .then(hasScope => (this.hasUpdateTagsPermission = hasScope));

      this.allTwitchTags = this.streamInfoService.state.channelInfo.availableTags;
      this.twitchTags = prepareOptions(
        this.i18nService.state.locale || this.i18nService.getFallbackLocale(),
        this.streamInfoService.state.channelInfo.tags,
      );
    }
  }

  async populateModels() {
    this.facebookPages = await this.fetchFacebookPages();
    this.streamTitleModel = this.streamInfoService.state.channelInfo.title;
    this.gameModel = this.streamInfoService.state.channelInfo.game || '';
    this.streamDescriptionModel = this.streamInfoService.state.channelInfo.description;
    this.gameOptions = [
      {
        title: this.streamInfoService.state.channelInfo.game,
        value: this.streamInfoService.state.channelInfo.game,
      },
    ];

    if (this.facebookPages) {
      this.pageModel = this.facebookPages.page_id;
      this.pageOptions = this.facebookPages.pages.map((page: IStreamlabsFacebookPage) => ({
        value: page.id,
        title: `${page.name} | ${page.category}`,
      }));
      this.hasPages = !!this.facebookPages.pages.length;
    }
    await this.loadAvailableProfiles();
  }

  onGameSearchChange(searchString: string) {
    if (searchString !== '') {
      this.searchingGames = true;
      const platform = this.userService.platform.type;
      const service = getPlatformService(platform);

      this.gameOptions = [];

      service.searchGames(searchString).then(games => {
        this.searchingGames = false;
        if (games && games.length) {
          games.forEach(game => {
            this.gameOptions.push({
              title: game.name,
              value: game.name,
            });
          });
        }
      });
    }
  }

  async loadAvailableProfiles() {
    if (this.midStreamMode) return;
    this.searchProfilesPending = true;
    this.selectedProfile = await this.videoEncodingOptimizationService.fetchOptimizedProfile(
      this.gameModel,
    );
    this.searchProfilesPending = false;
  }

  // For some reason, v-model doesn't work with ListInput
  onGameInput(gameModel: string) {
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

    this.videoEncodingOptimizationService.useOptimizedProfile(this.useOptimizedProfile);

    this.streamInfoService
      .setStreamInfo(
        this.streamTitleModel,
        this.streamDescriptionModel,
        this.gameModel,
        this.isTwitch && this.twitchTags && this.twitchTags.length ? this.twitchTags : undefined,
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

    if (this.selectedProfile && this.useOptimizedProfile) {
      this.videoEncodingOptimizationService.applyProfile(this.selectedProfile);
    }
  }

  async scheduleStream() {
    this.updatingInfo = true;

    const scheduledStartTime = this.formatDateString();
    const service = getPlatformService(this.userService.platform.type);
    const streamInfo = {
      title: this.streamTitleModel,
      description: this.streamDescriptionModel,
      game: this.gameModel,
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
            duration: 50 * e.error.message.length,
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
    this.streamingService.toggleStreaming();
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

  setTags(tags: TTwitchTagWithLabel[]) {
    this.twitchTags = tags;
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

  get gameMetadata() {
    return {
      loading: this.searchingGames,
      internalSearch: false,
      allowEmpty: true,
      placeholder: $t('Search'),
      options: this.gameOptions,
      noResult: $t('No matching game(s) found.'),
    };
  }

  fetchFacebookPages() {
    return this.userService.getFacebookPages();
  }

  setFacebookPageId(value: string) {
    this.pageModel = value;
    this.userService.postFacebookPage(value);
  }

  openFBPageCreateLink() {
    shell.openExternal('https://www.facebook.com/pages/creation/');
    this.windowsService.closeChildWindow();
  }

  get optimizedProfileMetadata() {
    const game = this.selectedProfile.game !== 'DEFAULT' ? `for ${this.gameModel}` : '';
    return {
      title: $t('Use optimized encoder settings ') + game,
      tooltip: $t(
        'Optimized encoding provides better quality and/or lower cpu/gpu usage. Depending on the game, ' +
          'resolution may be changed for a better quality of experience',
      ),
    };
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
