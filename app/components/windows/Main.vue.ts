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
import CustomLoader from '../CustomLoader';
import PatchNotes from '../pages/PatchNotes.vue';
import DesignSystem from '../pages/DesignSystem.vue';
import PlatformAppMainPage from '../pages/PlatformAppMainPage.vue';
import Help from '../pages/Help.vue';
import electron from 'electron';
import ResizeBar from 'components/shared/ResizeBar.vue';

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
    ResizeBar,
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
    const dockWidth = this.customizationService.state.livedockSize;
    if (dockWidth < 1) {
      // migrate from old percentage value to the pixel value
      this.resetWidth();
    }

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

  get theme() {
    return this.customizationService.currentTheme;
  }

  get applicationLoading() {
    return this.appService.state.loading;
  }

  get showLoadingSpinner() {
    return (
      this.appService.state.loading && this.page !== 'Onboarding' && this.page !== 'BrowseOverlays'
    );
  }

  get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  get renderDock() {
    return this.isLoggedIn && !this.isOnboarding && this.hasLiveDock;
  }

  get isDockCollapsed() {
    return this.customizationService.state.livedockCollapsed;
  }

  get leftDock() {
    return this.customizationService.state.leftDock;
  }

  get isOnboarding() {
    return this.navigationService.state.currentPage === 'Onboarding';
  }

  get platformApps() {
    return this.platformAppsService.enabledApps;
  }

  get errorAlert() {
    return this.appService.state.errorAlert;
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

    document.getElementsByTagName('body')[0].classList.add(this.theme);
  }

  destroyed() {
    window.removeEventListener('resize', this.windowSizeHandler);
  }

  windowWidth: number;

  hasLiveDock = true;

  windowResizeTimeout: number;

  windowSizeHandler() {
    this.onResizeStartHandler();
    this.windowWidth = window.innerWidth;

    clearTimeout(this.windowResizeTimeout);

    this.hasLiveDock = this.windowWidth >= 1100;
    this.windowResizeTimeout = window.setTimeout(
      () => this.windowsService.updateStyleBlockers('main', false),
      200,
    );
  }

  handleResize() {
    this.compactView = this.$refs.mainMiddle.clientWidth < 1200;
  }

  onResizeStartHandler() {
    this.windowsService.updateStyleBlockers('main', true);
  }

  onResizeStopHandler(offset: number) {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    offset = this.leftDock ? offset : -offset;
    this.setWidth(this.customizationService.state.livedockSize + offset);
    this.windowsService.updateStyleBlockers('main', false);
  }

  setWidth(width: number) {
    this.customizationService.setSettings({
      livedockSize: this.validateWidth(width),
    });
  }

  validateWidth(width: number): number {
    const appRect = this.$root.$el.getBoundingClientRect();
    const minEditorWidth = 860;
    const minWidth = 290;
    const maxWidth = Math.min(appRect.width - minEditorWidth, appRect.width / 2);
    // tslint:disable-next-line:no-parameter-reassignment TODO
    width = Math.max(minWidth, width);
    // tslint:disable-next-line:no-parameter-reassignment
    width = Math.min(maxWidth, width);
    return width;
  }

  updateWidth() {
    const width = this.customizationService.state.livedockSize;
    if (width !== this.validateWidth(width)) this.setWidth(width);
  }

  resetWidth() {
    const appRect = this.$root.$el.getBoundingClientRect();
    const defaultWidth = appRect.width * 0.28;
    this.setWidth(defaultWidth);
  }
}
