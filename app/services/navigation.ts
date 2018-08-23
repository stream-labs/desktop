import { StatefulService, mutation } from './stateful-service';

type TAppPage =
  | 'Studio'
  | 'Dashboard'
  | 'Live'
  | 'Onboarding'
  | 'BrowseOverlays'
  | 'PatchNotes'
  | 'Chatbot'
  | 'DesignSystem'
  | 'PlatformAppContainer';

interface INavigationState {
  currentPage: TAppPage;
  params: Dictionary<string>;
}

export class NavigationService extends StatefulService<INavigationState> {
  static initialState: INavigationState = {
    currentPage: 'Studio',
    params: {}
  };

  navigate(page: TAppPage, params: Dictionary<string> = {}) {
    this.NAVIGATE(page, params);
  }

  @mutation()
  private NAVIGATE(page: TAppPage, params: Dictionary<string>) {
    this.state.currentPage = page;
    this.state.params = params;
  }
}
