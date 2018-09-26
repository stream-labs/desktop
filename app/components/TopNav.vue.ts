import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { CustomizationService } from 'services/customization';
import { NavigationService } from 'services/navigation';
import { UserService } from 'services/user';
import electron from 'electron';
import Login from 'components/Login.vue';
import { SettingsService } from 'services/settings';
import { WindowsService } from 'services/windows';
import Utils from 'services/utils';
import { TransitionsService } from 'services/transitions';
import { IncrementalRolloutService, EAvailableFeatures } from 'services/incremental-rollout';

@Component({
  components: {
    Login
  }
})
export default class TopNav extends Vue {
  @Inject() settingsService: SettingsService;
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;
  @Inject() userService: UserService;
  @Inject() transitionsService: TransitionsService;
  @Inject() windowsService: WindowsService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;

  slideOpen = false;

  studioModeTooltip = 'Studio Mode';

  get availableFeatures() {
    return EAvailableFeatures;
  }

  @Prop()
  locked: boolean;

  navigateStudio() {
    this.navigationService.navigate('Studio');
  }

  navigateChatBot() {
    this.navigationService.navigate('Chatbot');
  }

  navigateDashboard() {
    this.navigationService.navigate('Dashboard');
  }

  navigateOverlays() {
    this.navigationService.navigate('BrowseOverlays');
  }

  navigateLive() {
    this.navigationService.navigate('Live');
  }

  navigateOnboarding() {
    this.navigationService.navigate('Onboarding');
  }

  navigateDesignSystem() {
    this.navigationService.navigate('DesignSystem');
  }

  enabledFeature(feature: EAvailableFeatures) {
    return this.incrementalRolloutService.availableFeatures.indexOf(feature) > -1;
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

  toggleNightTheme() {
    this.customizationService.nightMode = !this.customizationService.nightMode;
  }

  openDiscord() {
    electron.remote.shell.openExternal('https://discordapp.com/invite/stream');
  }

  get isDevMode() {
    return Utils.isDevMode();
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
}
