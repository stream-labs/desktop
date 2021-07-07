import { Module, EApiPermissions, apiMethod, IApiContext } from './module';
import { Inject } from 'services/core/injector';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService } from 'services/platform-apps';

interface INavigation {
  sourceId?: string;
}

enum EPage {
  Editor = 'Editor',
  Live = 'Live',
  Themes = 'Themes',
  AppDetailsPage = 'AppDetailsPage',
}

type TNavigationCallback = (nav: INavigation) => void;

export class AppModule extends Module {
  readonly moduleName = 'App';
  readonly permissions: EApiPermissions[] = [];

  @Inject() navigationService: NavigationService;
  @Inject() platformAppsService: PlatformAppsService;

  callbacks: Dictionary<TNavigationCallback> = {};

  constructor() {
    super();
    this.navigationService.navigated.subscribe(nav => {
      if (nav.currentPage === 'PlatformAppMainPage') {
        if (this.callbacks[nav.params.appId as string]) {
          const data: INavigation = {};

          if (nav.params.sourceId) data.sourceId = nav.params.sourceId as string;

          this.callbacks[nav.params.appId as string](data);
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
    if (page === EPage.Editor) {
      this.navigationService.navigate('Studio');
    } else if (page === EPage.Themes) {
      this.navigationService.navigate('BrowseOverlays');
    } else if (page === EPage.AppDetailsPage) {
      this.navigationService.navigate('PlatformAppStore', { appId: ctx.app.id });
    }
  }

  @apiMethod()
  reload(ctx: IApiContext) {
    this.platformAppsService.refreshApp(ctx.app.id);
  }
}
