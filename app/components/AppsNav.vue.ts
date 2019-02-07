import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService, EAppPageSlot, ILoadedApp } from 'services/platform-apps';
import VueResize from 'vue-resize';
import HScroll, { IHScrollModel } from './shared/HScroll.vue';
Vue.use(VueResize);

/**
 * The default amount the nav bar should scroll when clicking the scroll arrow buttons.
 */
const DEFAULT_SCROLL_DELTA = 250;

@Component({
  components: { HScroll },
})
export default class AppsNav extends Vue {
  @Inject()
  platformAppsService: PlatformAppsService;
  @Inject()
  navigationService: NavigationService;

  scrollModel: IHScrollModel = {
    canScroll: false,
    canScrollLeft: false,
    canScrollRight: false,
  };

  $refs: {
    scroll: HScroll;
  };

  isSelectedApp(appId: string) {
    return (
      this.page === 'PlatformAppMainPage' && this.navigationService.state.params.appId === appId
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
    const topNavPage = app.manifest.pages.find(page => page.slot === EAppPageSlot.TopNav);
    if (!topNavPage) return false;

    // Default result is true
    return topNavPage.allowPopout == null ? true : topNavPage.allowPopout;
  }

  popOut(appId: string) {
    this.platformAppsService.popOutAppPage(appId, EAppPageSlot.TopNav);
  }

  refreshApp(appId: string) {
    this.platformAppsService.refreshApp(appId);
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  navigateApp(appId: string) {
    this.navigationService.navigate('PlatformAppMainPage', { appId });
  }

  scrollLeft() {
    this.scrollNav(-DEFAULT_SCROLL_DELTA);
  }

  scrollRight() {
    this.scrollNav(DEFAULT_SCROLL_DELTA);
  }

  private scrollNav(horizontal: number) {
    this.$refs.scroll.scrollBy(horizontal, 0, true);
  }
}
