import Vue from 'vue';
import moment from 'moment';
import { Component } from 'vue-property-decorator';
import ModalLayout from '../ModalLayout.vue';
import { BoolInput, ListInput } from 'components/shared/inputs/inputs';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';
import { UserService } from 'services/user';
import { Inject } from 'services/core/injector';
import { getPlatformService, TPlatform } from 'services/platforms';
import { StreamingService } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import { $t, I18nService } from 'services/i18n';
import { FacebookService, IFacebookStartStreamOptions } from 'services/platforms/facebook';
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
import Translate from 'components/shared/translate';

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
    Translate,
  },
})
export default class EditStreamInfo extends Vue {
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
  infoError = false;
  channelInfo = cloneDeep(getPlatformService(this.platform).state.settings);

  $refs: {
    form: ValidatedForm;
  };

  get hasUpdateTagsPermission() {
    return this.twitchService.state.hasUpdateTagsPermission;
  }

  get hasPages() {
    return (
      !this.infoLoading &&
      this.isFacebook &&
      this.facebookService.state?.facebookPages?.pages?.length
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
      date: metadata.date({
        title: $t('Scheduled Date'),
        disablePastDates: true,
        required: true,
        disabled: this.updatingInfo,
        description: this.isFacebook
          /* eslint-disable */
          ? $t('Please schedule no further than 7 days in advance and no sooner than 10 minutes in advance.')
          : undefined,
          /* eslint-enable */
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

  async scheduleStream() {
    this.updatingInfo = true;

    const scheduledStartTime = new Date(
      this.startTimeModel.date + this.startTimeModel.time * 1000,
    ).toISOString();
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
          this.$toasted.show(e.message, {
            position: 'bottom-center',
            className: 'toast-alert',
            duration: 50 * e.message.length,
            singleton: true,
          });
        });
    }

    this.updatingInfo = false;
  }

  async handleSubmit() {
    if (await this.$refs.form.validateAndGetErrorsCount()) return;
    if (this.isFacebook && !(this.channelInfo as IFacebookStartStreamOptions).game) {
      this.showGameError();
      return;
    }
    if (this.isSchedule) return this.scheduleStream();
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

  cancel() {
    this.windowsService.closeChildWindow();
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
}
