import Vue from 'vue';
import moment from 'moment';
import { Component } from 'vue-property-decorator';
import ModalLayout from '../ModalLayout.vue';
import { BoolInput, ListInput } from 'components/shared/inputs/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { StreamInfoService, TCombinedChannelInfo } from 'services/stream-info';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';
import { UserService } from 'services/user';
import { Inject } from 'services/core/injector';
import { getPlatformService, TPlatform } from 'services/platforms';
import { StreamingService } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import { $t, I18nService } from 'services/i18n';
import { FacebookService } from 'services/platforms/facebook';
import {
  VideoEncodingOptimizationService,
  IEncoderProfile,
} from 'services/video-encoding-optimizations';
import electron, { shell } from 'electron';
import { formMetadata, IListOption, metadata } from '../shared/inputs';
import TwitchTagsInput from 'components/shared/inputs/TwitchTagsInput.vue';
import { TwitchService } from 'services/platforms/twitch';
import { TwitterService } from 'services/integrations/twitter';
import { Twitter } from '../Twitter';
import { cloneDeep } from 'lodash';
import { Debounce } from 'lodash-decorators';
import { Spinner, ProgressBar } from 'streamlabs-beaker';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import Utils from 'services/utils';
import YoutubeEditStreamInfo from 'components/platforms/youtube/YoutubeEditStreamInfo';
import { YoutubeService } from 'services/platforms/youtube';
import { RestreamService } from 'services/restream';

@Component({
  components: {
    ModalLayout,
    HFormGroup,
    BoolInput,
    ListInput,
    TwitchTagsInput,
    ValidatedForm,
    Spinner,
    Twitter,
    YoutubeEditStreamInfo,
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
  @Inject() twitterService: TwitterService;
  @Inject() facebookService: FacebookService;
  @Inject() i18nService: I18nService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;
  @Inject() restreamService: RestreamService;

  // UI State Flags
  searchingGames = false;
  updatingInfo = false;
  updateError = false;
  selectedProfile: IEncoderProfile = null;

  gameOptions: IListOption<string>[] = [];

  doNotShowAgainModel: boolean = false;

  startTimeModel: { time: number; date: string } = {
    time: null,
    date: null,
  };

  tweetModel: string = '';

  searchProfilesPending = false;
  channelInfo: TCombinedChannelInfo = null;
  infoError = false;

  $refs: {
    form: ValidatedForm;
  };

  get hasUpdateTagsPermission() {
    return this.channelInfo.hasUpdateTagsPermission;
  }

  get hasPages() {
    return (
      !this.infoLoading &&
      this.isFacebook &&
      this.facebookService.state.facebookPages &&
      this.facebookService.state.facebookPages.pages.length
    );
  }

  get shouldPostTweet() {
    return (
      this.twitterService.state.linked &&
      this.twitterService.state.tweetWhenGoingLive &&
      !this.isSchedule &&
      !this.midStreamMode
    );
  }

  get formMetadata() {
    return formMetadata({
      page: metadata.list({
        name: 'stream_page',
        title: $t('Facebook Page'),
        fullWidth: true,
        options: this.isFacebook && this.facebookService.state.facebookPages.options,
      }),
      game: metadata.list({
        title: $t('Game'),
        placeholder: $t('Start typing to search'),
        options: this.gameOptions,
        loading: this.searchingGames,
        internalSearch: false,
        allowEmpty: true,
        noResult: $t('No matching game(s) found.'),
        required: true,
        disabled: this.updatingInfo,
      }),
      title: metadata.text({
        title: $t('Title'),
        fullWidth: true,
        required: true,
        disabled: this.updatingInfo,
      }),
      description: metadata.textArea({
        title: $t('Description'),
        disabled: this.updatingInfo,
        fullWidth: true,
      }),
      date: metadata.text({
        title: $t('Scheduled Date'),
        dateFormat: 'MM/dd/yyyy',
        placeholder: 'MM/DD/YYYY',
        required: true,
        disabled: this.updatingInfo,
        description: this.isFacebook
          ? $t(
              'Please schedule no further than 7 days in advance and no sooner than 10 minutes in advance.',
            )
          : undefined,
      }),
      time: metadata.timer({
        title: $t('Scheduled Time'),
        format: 'hm',
        max: 24 * 3600,
      }),
    });
  }

  get useOptimizedProfile() {
    return this.videoEncodingOptimizationService.state.useOptimizedProfile;
  }

  set useOptimizedProfile(enabled: boolean) {
    this.videoEncodingOptimizationService.useOptimizedProfile(enabled);
  }

  async created() {
    await this.populateInfo();
  }

  @Debounce(500)
  async onGameSearchHandler(searchString: string) {
    if (searchString !== '') {
      this.searchingGames = true;
      const service = getPlatformService(this.platform);

      this.gameOptions = [];

      return service.searchGames(searchString).then(games => {
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
      this.channelInfo.game,
    );
    this.searchProfilesPending = false;
  }

  // For some reason, v-model doesn't work with ListInput
  onGameInput(gameModel: string) {
    this.channelInfo.game = gameModel;
    this.loadAvailableProfiles();
  }

  updateAndGoLive() {
    this.updatingInfo = true;

    if (this.doNotShowAgainModel) {
      electron.remote.dialog.showMessageBox({
        message:
          $t('You will not be asked again to update your stream info when going live. ') +
          $t('You can re-enable this from the settings.'),
      });

      this.customizationService.setUpdateStreamInfoOnLive(false);
    }

    this.videoEncodingOptimizationService.useOptimizedProfile(this.useOptimizedProfile);

    if (this.midStreamMode) {
      const platform = getPlatformService(this.userService.platform.type);
      platform
        .putChannelInfo(this.channelInfo)
        .then(success => {
          if (success) {
            this.windowsService.closeChildWindow();
          } else {
            this.updateError = true;
            this.updatingInfo = false;
          }
        })
        .catch(e => {
          this.$toasted.show(e.message, {
            position: 'bottom-center',
            className: 'toast-alert',
            duration: 5000,
            singleton: true,
          });
          this.updatingInfo = false;
        });
      return;
    }

    if (this.selectedProfile && this.useOptimizedProfile) {
      this.videoEncodingOptimizationService.applyProfile(this.selectedProfile);
    }

    this.goLive();
  }

  async scheduleStream() {
    this.updatingInfo = true;

    const scheduledStartTime = this.formatDateString();
    const service = getPlatformService(this.userService.platform.type);
    if (scheduledStartTime) {
      await service
        .scheduleStream(scheduledStartTime, this.channelInfo)
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

  async handleSubmit() {
    if (this.infoError || this.updateError) {
      await this.goLive(true);
      return;
    }

    if (await this.$refs.form.validateAndGetErrorsCount()) return;
    if (this.isFacebook && !this.channelInfo.game) {
      this.showGameError();
      return;
    }
    if (this.isSchedule) return this.scheduleStream();
    if (this.twitterIsEnabled && this.shouldPostTweet) {
      const tweetedSuccessfully = await this.handlePostTweet();
      if (!tweetedSuccessfully) return;
    }

    if (this.restreamService.shouldGoLiveWithRestream) {
      this.updatingInfo = true;
      await this.restreamService.stagePlatform(this.platform, this.channelInfo);

      if (!this.isFinalStep) {
        this.streamingService.showEditStreamInfo(
          this.windowQuery.platforms,
          this.windowQuery.platformStep + 1,
        );
        return;
      }
    }

    this.updateAndGoLive();
  }

  showGameError() {
    this.$toasted.show($t('You must select a game'), {
      position: 'bottom-center',
      className: 'toast-alert',
      duration: 2500,
      singleton: true,
    });
    this.updatingInfo = false;
  }

  async handlePostTweet() {
    this.updatingInfo = true;
    let success = false;
    try {
      await this.twitterService.postTweet(this.tweetModel);
      success = true;
    } catch (e) {
      this.$toasted.show(`Twitter: ${e.error}`, {
        position: 'bottom-center',
        className: 'toast-alert',
        duration: 2000,
        singleton: true,
      });
      success = false;
      this.updateError = true;
    }
    this.updatingInfo = false;
    return success;
  }

  async goLive(force = false) {
    try {
      this.updatingInfo = true;
      await this.streamingService.toggleStreaming(this.channelInfo, force);
      this.streamInfoService.createGameAssociation(this.channelInfo.game);
      this.windowsService.closeChildWindow();
      // youtube needs additional actions after the stream has been started
      if (this.isYoutube) (this.platformService as YoutubeService).showStreamStatusWindow();
    } catch (e) {
      const message = this.platformService.getErrorDescription(e);
      this.$toasted.show(message, {
        position: 'bottom-center',
        className: 'toast-alert',
        duration: 1000,
        singleton: true,
      });
      this.infoError = true;
      this.updatingInfo = false;
    }
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }

  async populateInfo() {
    // set the local state of the channelInfo
    this.channelInfo = null;
    this.infoError = false;
    try {
      this.channelInfo = cloneDeep(
        await this.platformService.prepopulateInfo(),
      ) as TCombinedChannelInfo;
      this.infoError = false;
    } catch (e) {
      this.infoError = true;
      return;
    }

    // the ListInput component requires the selected game to be in the options list
    if (this.channelInfo.game) {
      this.gameOptions = [{ value: this.channelInfo.game, title: this.channelInfo.game }];
    }

    // check available profiles for the selected game
    await this.loadAvailableProfiles();
  }

  get platformService() {
    return getPlatformService(this.platform);
  }

  get windowHeading() {
    if (this.windowQuery.platforms) {
      return `Setup ${this.platform.charAt(0).toUpperCase() + this.platform.slice(1)} (${this
        .windowQuery.platformStep + 1}/${this.windowQuery.platforms.length})`;
    }
  }

  get windowQuery() {
    return this.windowsService.getChildWindowQueryParams();
  }

  get isFinalStep() {
    if (!this.windowQuery.platforms) return true;

    return this.windowQuery.platforms.length === this.windowQuery.platformStep + 1;
  }

  get platform(): TPlatform {
    if (this.windowQuery.platforms) {
      return this.windowQuery.platforms[this.windowQuery.platformStep];
    }

    return this.userService.platform.type;
  }

  get isTwitch() {
    return this.platform === 'twitch';
  }

  get isYoutube() {
    return this.platform === 'youtube';
  }

  get isMixer() {
    return this.platform === 'mixer';
  }

  get isFacebook() {
    return this.platform === 'facebook';
  }

  get isServicedPlatform() {
    return this.isFacebook || this.isYoutube || this.isTwitch || this.isMixer;
  }

  get twitterIsEnabled() {
    // Twitter is always done on the final step
    if (!this.isFinalStep) return false;

    return (
      Utils.isPreview() ||
      this.incrementalRolloutService.featureIsEnabled(EAvailableFeatures.twitter)
    );
  }

  get submitText() {
    if (!this.isFinalStep) return $t('Next');
    if (this.midStreamMode) return $t('Update');
    if (this.isSchedule) return $t('Schedule');
    if (this.twitterIsEnabled && this.shouldPostTweet) return $t('Tweet & Go Live');

    if (this.infoError || this.updateError) return $t('Go Live');
    return $t('Confirm & Go Live');
  }

  midStreamMode = this.streamingService.isStreaming;

  get isSchedule() {
    return this.windowsService.getChildWindowQueryParams().isSchedule;
  }

  get infoLoading() {
    return !this.channelInfo && !this.infoError;
  }

  openFBPageCreateLink() {
    shell.openExternal('https://www.facebook.com/gaming/pages/create?ref=streamlabs');
    this.windowsService.closeChildWindow();
  }

  get optimizedProfileMetadata() {
    const game = this.selectedProfile.game !== 'DEFAULT' ? `for ${this.channelInfo.game}` : '';
    return {
      title: $t('Use optimized encoder settings ') + game,
      tooltip: $t(
        'Optimized encoding provides better quality and/or lower cpu/gpu usage. Depending on the game, ' +
          'resolution may be changed for a better quality of experience',
      ),
    };
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
