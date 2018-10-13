import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService, EAppPageSlot } from 'services/platform-apps';

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

  created() {
    window.addEventListener('resize', this.calculateScrolls);
  }

  destroyed() {
    window.removeEventListener('resize', this.calculateScrolls);
  }

  mounted() {
    this.isMounted = true;
    this.appTabsContainer = this.$refs.app_tabs;
    this.calculateScrolls();
  }

  scrollLeft() {
    this.appTabsContainer.scrollLeft =
      this.appTabsContainer.scrollLeft - this.scrollIncrement;
  }

  scrollRight() {
    this.appTabsContainer.scrollLeft =
      this.appTabsContainer.scrollLeft + this.scrollIncrement;
  }

  calculateScrolls() {
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
    return this.navigationService.state.params.appId === appId;
  }

  // get topNavApps() {
  //   return this.platformAppsService.enabledApps.filter(app => {
  //     return !!app.manifest.pages.find(page => {
  //       return page.slot === EAppPageSlot.TopNav;
  //     });
  //   });
  // }

  get topNavApps() {
    let x: any[] = [];
    let i = 10;

    while (i > 0) {
      x = x.concat(this.platformAppsService.enabledApps.filter(app => {
        return !!app.manifest.pages.find(page => {
          return page.slot === EAppPageSlot.TopNav;
        });
      }));
      i--;
    }

    return x;
  }

  get page() {
    return this.navigationService.state.currentPage;
  }

  navigateApp(appId: string) {
    this.navigationService.navigate('PlatformAppContainer', { appId });
  }
}
