import Vue from 'vue';
import cx from 'classnames';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService, EAppPageSlot, ILoadedApp } from 'services/platform-apps';
import VueResize from 'vue-resize';
import styles from './AppsNav.m.less';
Vue.use(VueResize);

/**
 * The default amount the nav bar should scroll when clicking the scroll arrow buttons.
 */
const DEFAULT_SCROLL_DELTA = 43;

@Component({})
export default class AppsNav extends Vue {
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() navigationService: NavigationService;

  $refs: {
    scroll: HTMLElement;
  };

  upArrowVisible = false;
  downArrowVisible = false;

  mounted() {
    this.handleScroll();
  }

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

  iconSrc(appId: string, path: string) {
    return this.platformAppsService.views.getAssetUrl(appId, path);
  }

  scrollUp() {
    this.scrollNav(-DEFAULT_SCROLL_DELTA);
  }

  scrollDown() {
    this.scrollNav(DEFAULT_SCROLL_DELTA);
  }

  handleScroll() {
    const el = this.$refs.scroll;
    if (!el) return;
    if (el.scrollTop > 0) {
      this.upArrowVisible = true;
    } else {
      this.upArrowVisible = false;
    }
    if (el.scrollHeight - el.scrollTop === el.clientHeight) {
      this.downArrowVisible = false;
    } else if (el.scrollHeight > el.clientHeight) {
      this.downArrowVisible = true;
    }
  }

  private scrollNav(vertical: number) {
    this.$refs.scroll.scrollBy({ top: vertical, behavior: 'smooth' });
  }

  refreshIcon(app: ILoadedApp) {
    return (
      app.unpacked && (
        <div class={styles.refreshIcon} onClick={() => this.refreshApp(app.id)}>
          <i class="icon-repeat" />
        </div>
      )
    );
  }

  render() {
    return (
      <div class={styles.wrapper}>
        <div class={styles.scroll} ref="scroll" onScroll={this.handleScroll.bind(this)}>
          {this.navApps.map(app => (
            <div style="position: relative;">
              {
                <div
                  class={cx(styles.activeApp, { [styles.active]: this.isSelectedApp(app.id) })}
                />
              }
              <div
                title={app.manifest.name}
                onClick={() => this.navigateApp(app.id)}
                draggable
                // funky casing since vue is dumb
                onDragend={() => this.popOut(app)}
                class={styles.appTab}
              >
                {app.manifest.icon ? (
                  <img src={this.iconSrc(app.id, app.manifest.icon)} />
                ) : (
                  <i class="icon-integrations" />
                )}
              </div>
              {this.refreshIcon(app)}
            </div>
          ))}
        </div>
        {this.upArrowVisible && (
          <div class={cx(styles.arrow, styles.up)} onClick={this.scrollUp.bind(this)}>
            <i class="icon-down" />
          </div>
        )}
        {this.downArrowVisible && (
          <div class={cx(styles.arrow, styles.down)} onClick={this.scrollDown.bind(this)}>
            <i class="icon-down" />
          </div>
        )}
      </div>
    );
  }
}
