import Vue from 'vue';
import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService, EAppPageSlot, ILoadedApp } from 'services/platform-apps';
import VueResize from 'vue-resize';
import HScroll, { IHScrollModel } from './shared/HScroll.vue';
import styles from './AppsNav.m.less';
Vue.use(VueResize);

/**
 * The default amount the nav bar should scroll when clicking the scroll arrow buttons.
 */
const DEFAULT_SCROLL_DELTA = 250;

@Component({
  components: { HScroll },
})
export default class AppsNav extends Vue {
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() navigationService: NavigationService;

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

  get navApps() {
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

  popOut(app: ILoadedApp) {
    if (!this.isPopOutAllowed(app)) return;
    this.platformAppsService.popOutAppPage(app.id, EAppPageSlot.TopNav);
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

  private scrollNav(vertical: number) {
    this.$refs.scroll.scrollBy(0, vertical, true);
  }

  render(h: Function) {
    return (
      <div class={styles.wrapper}>
        {this.navApps.map(app => (
          <div
            title={app.manifest.name}
            onClick={() => this.navigateApp(app.id)}
            draggable
            onDragEnd={() => this.popOut(app)}
            class={cx(styles.appTab, { [styles.isActive]: this.isSelectedApp(app.id) })}
          >
            <i class="icon-integrations" />
            {app.logo && <img src={app.logo} />}
          </div>
        ))}
      </div>
    );
  }
}
