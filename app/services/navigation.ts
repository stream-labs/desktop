import { StatefulService, mutation } from './core/stateful-service';
import { Subject } from 'rxjs';
import { Inject } from 'services/core';
import { SideNavService } from 'app-services';

export type TAppPage =
  | 'Studio'
  | 'Onboarding'
  | 'BrowseOverlays'
  | 'PatchNotes'
  | 'PlatformAppMainPage'
  | 'PlatformAppStore'
  | 'PlatformMerge'
  | 'LayoutEditor'
  | 'PrimeExpiration'
  | 'AlertboxLibrary'
  | 'StreamScheduler'
  | 'Highlighter'
  | 'Grow'
  | 'ThemeAudit'
  | 'RecordingHistory'
  | 'Collaborate';

interface INavigationState {
  currentPage: TAppPage;
  params: Dictionary<string | boolean>;
}

export class NavigationService extends StatefulService<INavigationState> {
  @Inject() sideNavService: SideNavService;
  static initialState: INavigationState = {
    currentPage: 'Studio',
    params: {},
  };

  navigated = new Subject<INavigationState>();

  navigate(page: TAppPage, params: Dictionary<string | boolean> = {}) {
    this.NAVIGATE(page, params);
    this.navigated.next(this.state);
  }

  navigateApp(appId: string, key?: string) {
    this.navigate('PlatformAppMainPage', { appId });
    this.sideNavService.setCurrentMenuItem(key ?? appId);
  }

  @mutation()
  private NAVIGATE(page: TAppPage, params: Dictionary<string | boolean>) {
    this.state.currentPage = page;
    this.state.params = params;
  }
}
