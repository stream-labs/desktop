import { StatefulService, mutation } from './stateful-service';

type TAppPage = 'Studio' | 'Dashboard' | 'Live' | 'Onboarding';

interface INavigationState {
  currentPage: TAppPage;
}

export class NavigationService extends StatefulService<INavigationState> {

  static initialState: INavigationState = {
    currentPage: 'Studio'
  };

  navigate(page: TAppPage) {
    this.NAVINGATE(page);
  }

  @mutation()
  private NAVINGATE(page: TAppPage) {
    this.state.currentPage = page;
  }

}
