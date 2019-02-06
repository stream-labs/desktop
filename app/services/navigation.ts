import { StatefulService, mutation } from './stateful-service';
import { Subject } from 'rxjs';

export type TAppPage =
  | 'Studio'
  | 'Dashboard'
  | 'Live'
  | 'Onboarding'
  | 'BrowseOverlays'
  | 'PatchNotes'
  | 'Chatbot'
  | 'DesignSystem'
  | 'PlatformAppMainPage'
  | 'PlatformAppStore'
  | 'Help';

interface INavigationState {
  currentPage: TAppPage;
  params: Dictionary<string>;
}

export class NavigationService extends StatefulService<INavigationState> {
  static initialState: INavigationState = {
    currentPage: 'Studio',
    params: {},
  };

  navigated = new Subject<INavigationState>();

  navigate(page: TAppPage, params: Dictionary<string> = {}) {
    this.NAVIGATE(page, params);
    this.navigated.next(this.state);
  }

  @mutation()
  private NAVIGATE(page: TAppPage, params: Dictionary<string>) {
    this.state.currentPage = page;
    this.state.params = params;
  }
}
