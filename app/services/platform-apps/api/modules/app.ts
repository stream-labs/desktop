import { Module, EApiPermissions, apiMethod, IApiContext } from './module';
import { Inject } from 'util/injector';
import { NavigationService } from 'services/navigation';

interface INavigation {
  sourceId?: string;
}

enum EPage {
  Editor = 'Editor',
  Live = 'Live',
  Dashboard = 'Dashboard',
  Themes = 'Themes',
  AppDetailsPage = 'AppDetailsPage',
}

type TNavigationCallback = (nav: INavigation) => void;

export class AppModule extends Module {
  readonly moduleName = 'App';
  readonly permissions: EApiPermissions[] = [];

  @Inject() navigationService: NavigationService;

  callbacks: Dictionary<TNavigationCallback> = {};

  constructor() {
    super();
    this.navigationService.navigated.subscribe(nav => {
      if (nav.currentPage === 'PlatformAppMainPage') {
        if (this.callbacks[nav.params.appId]) {
          const data: INavigation = {};

          if (nav.params.sourceId) data.sourceId = nav.params.sourceId;

          this.callbacks[nav.params.appId](data);
        }
      }
    });
  }

  @apiMethod()
  onNavigation(ctx: IApiContext, cb: TNavigationCallback) {
    this.callbacks[ctx.app.id] = cb;
  }

  @apiMethod()
  navigate(ctx: IApiContext, page: EPage) {
    if (page === EPage.Dashboard) {
      this.navigationService.navigate('Dashboard');
    } else if (page === EPage.Editor) {
      this.navigationService.navigate('Studio');
    } else if (page === EPage.Live) {
      this.navigationService.navigate('Live');
    } else if (page === EPage.Themes) {
      this.navigationService.navigate('BrowseOverlays');
    } else if (page === EPage.AppDetailsPage) {
      this.navigationService.navigate('PlatformAppStore', { appId: ctx.app.id });
    }
  }
}
