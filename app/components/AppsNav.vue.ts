import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NavigationService } from 'services/navigation';
import {
  PlatformAppsService,
  EAppPageSlot,
  ILoadedApp
} from 'services/platform-apps';
import VueResize from 'vue-resize';
Vue.use(VueResize);

@Component({})
export default class AppsNav extends Vue {
  @Inject()
  platformAppsService: PlatformAppsService;
  @Inject()
  navigationService: NavigationService;

  $refs: {
    app_tabs: HTMLDivElement;
  };

  isMounted = false;

  appTabsContainer: HTMLDivElement = null;
  canScroll = false;
  hasNext = false;
  hasPrev = false;

  private scrollIncrement = 100;

  mounted() {
    this.isMounted = true;
    this.appTabsContainer = this.$refs.app_tabs;
  }

  scrollLeft() {
    this.appTabsContainer.scrollLeft =
      this.appTabsContainer.scrollLeft - this.scrollIncrement;
  }

  scrollRight() {
    this.appTabsContainer.scrollLeft =
      this.appTabsContainer.scrollLeft + this.scrollIncrement;
  }

  handleResize() {
    if (!this.isMounted) return false;

    this.canScroll =
      this.appTabsContainer.scrollWidth > this.appTabsContainer.clientWidth;
    this.hasPrev = this.appTabsContainer.scrollLeft > 0;
    let scrollRight =
      this.appTabsContainer.scrollWidth -
      (this.appTabsContainer.scrollLeft + this.appTabsContainer.clientWidth);

    this.hasNext = scrollRight > 0;
  }

  isSelectedApp(appId: string) {
    return (
      this.page === 'PlatformAppContainer' &&
      this.navigationService.state.params.appId === appId
    );
  }

  get topNavApps() {
    return this.platformAppsService.enabledApps.filter(app => {
      return !!app.manifest.pages.find(page => {
        return page.slot === EAppPageSlot.TopNav;
      });
    });
  }

  isPopOutAllowed(app: ILoadedApp) {
    const topNavPage = app.manifest.pages.find(
      page => page.slot === EAppPageSlot.TopNav
    );
    if (!topNavPage) return false;

    // Default result is true
    return topNavPage.allowPopout == null ? true : topNavPage.allowPopout;
  }

  popOut(appId: string) {
    this.platformAppsService.popOutAppPage(appId, EAppPageSlot.TopNav);
  }

  refreshApp(appId: string) {
    this.platformAppsService.reloadApp(appId);
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  navigateApp(appId: string) {
    this.navigationService.navigate('PlatformAppContainer', { appId });
  }
}
