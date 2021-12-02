import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { CustomizationService } from 'services/customization';
import { NavigationService } from 'services/navigation';
import { UserService } from 'services/user';
import electron from 'electron';
import Login from 'components/Login.vue';
import StreamingStatus from 'components/StreamingStatus.vue';
import { SettingsService } from 'services/settings';
import Utils from 'services/utils';
import { TransitionsService } from 'services/transitions';
import { InformationsService } from 'services/informations';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';

@Component({
  components: {
    Login,
    StreamingStatus,
  },
})
export default class SideNav extends Vue {
  @Inject() settingsService: SettingsService;
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;
  @Inject() userService: UserService;
  @Inject() transitionsService: TransitionsService;
  @Inject() informationsService: InformationsService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;

  slideOpen = false;

  studioModeTooltip = 'Studio Mode';

  get availableFeatures() {
    return EAvailableFeatures;
  }

  @Prop() locked: boolean;

  navigateStudio() {
    this.navigationService.navigate('Studio');
  }

  navigateOnboarding() {
    this.navigationService.navigate('Onboarding');
  }

  featureIsEnabled(feature: EAvailableFeatures) {
    return this.incrementalRolloutService.featureIsEnabled(feature);
  }

  studioMode() {
    if (this.transitionsService.state.studioMode) {
      this.transitionsService.disableStudioMode();
    } else {
      this.transitionsService.enableStudioMode();
    }
  }

  get studioModeEnabled() {
    return this.transitionsService.state.studioMode;
  }

  openSettingsWindow() {
    this.settingsService.showSettings();
  }

  openFeedback() {
    electron.remote.shell.openExternal('https://secure.nicovideo.jp/form/entry/n_air_feedback');
  }

  openHelp() {
    electron.remote.shell.openExternal(
      'https://qa.nicovideo.jp/faq/show/11857?site_domain=default',
    );
  }

  get isDevMode() {
    return Utils.isDevMode();
  }

  openInformations() {
    this.informationsService.showInformations();
  }

  openDevTools() {
    electron.ipcRenderer.send('openDevTools');
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  get isUserLoggedIn() {
    return this.userService.isLoggedIn();
  }

  get hasUnseenInformation() {
    return this.informationsService.hasUnseenItem;
  }
}
