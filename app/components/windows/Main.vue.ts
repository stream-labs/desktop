import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import TopNav from '../TopNav.vue';
import AppsNav from '../AppsNav.vue';
import NewsBanner from '../NewsBanner';
import { ScenesService } from 'services/scenes';
import { PlatformAppsService } from 'services/platform-apps';
import VueResize from 'vue-resize';
Vue.use(VueResize);

// Pages
import Studio from '../pages/Studio.vue';
import Dashboard from '../pages/Dashboard.vue';
import Chatbot from '../pages/Chatbot.vue';
import PlatformAppStore from '../pages/PlatformAppStore.vue';
import BrowseOverlays from 'components/pages/BrowseOverlays.vue';
import Live from '../pages/Live.vue';
import Onboarding from '../pages/Onboarding.vue';
import TitleBar from '../TitleBar.vue';
import { Inject } from '../../util/injector';
import { CustomizationService } from 'services/customization';
import { NavigationService } from 'services/navigation';
import { AppService } from 'services/app';
import { UserService } from 'services/user';
import { WindowsService } from 'services/windows';
import LiveDock from '../LiveDock.vue';
import StudioFooter from '../StudioFooter.vue';
import CustomLoader from '../CustomLoader.vue';
import PatchNotes from '../pages/PatchNotes.vue';
import DesignSystem from '../pages/DesignSystem.vue';
import PlatformAppMainPage from '../pages/PlatformAppMainPage.vue';
import Help from '../pages/Help.vue';
import electron from 'electron';

@Component({
  components: {
    TitleBar,
    TopNav,
    AppsNav,
    Studio,
    Dashboard,
    BrowseOverlays,
    Live,
    Onboarding,
    LiveDock,
    StudioFooter,
    CustomLoader,
    PatchNotes,
    NewsBanner,
    Chatbot,
    DesignSystem,
    PlatformAppMainPage,
    PlatformAppStore,
    Help,
  },
})
export default class Main extends Vue {
  @Inject() customizationService: CustomizationService;
  @Inject() navigationService: NavigationService;
  @Inject() appService: AppService;
  @Inject() userService: UserService;
  @Inject() windowsService: WindowsService;
  @Inject() scenesService: ScenesService;
  @Inject() platformAppsService: PlatformAppsService;

  mounted() {
    electron.remote.getCurrentWindow().show();
    this.handleResize();
  }

  get title() {
    return this.windowsService.state.main.title;
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  get params() {
    return this.navigationService.state.params;
  }

  get nightTheme() {
    return this.customizationService.nightMode;
  }

  get applicationLoading() {
    return this.appService.state.loading;
  }

  get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  mainContentsRight = false;

  get leftDock() {
    this.mainContentsRight = this.customizationService.state.leftDock;
    return this.customizationService.state.leftDock;
  }

  get isOnboarding() {
    return this.navigationService.state.currentPage === 'Onboarding';
  }

  get platformApps() {
    return this.platformAppsService.enabledApps;
  }

  onDropHandler(event: DragEvent) {
    const files = event.dataTransfer.files;

    let fi = files.length;
    while (fi--) {
      const file = files.item(fi);
      this.scenesService.activeScene.addFile(file.path);
    }
  }

  $refs: {
    mainMiddle: HTMLDivElement;
  };

  compactView = false;

  get mainResponsiveClasses() {
    const classes = [];

    if (this.compactView) {
      classes.push('main-middle--compact');
    }

    return classes.join(' ');
  }

  created() {
    window.addEventListener('resize', this.windowSizeHandler);
  }

  destroyed() {
    window.removeEventListener('resize', this.windowSizeHandler);
  }

  windowWidth: number;

  hasLiveDock = true;

  windowSizeHandler() {
    this.windowWidth = window.innerWidth;

    this.hasLiveDock = this.windowWidth >= 1100;
  }

  handleResize() {
    this.compactView = this.$refs.mainMiddle.clientWidth < 1200;
  }
}
