import { StatefulService, InitAfter, ViewHandler, mutation } from 'services/core';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';

export type TOutputDisplayType = 'desktop' | 'mobile';

// @@@ TODO: export?
// interface IDualOutput {
//   dualOutputMode: boolean;
// }

interface IDualOutputServiceState {
  isDesktopActive: boolean;
  isMobileActive: boolean;
  dualOutputMode: boolean;
}

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
  get dualOutputMode() {
    return this.state.dualOutputMode;
  }

  get isDesktopActive() {
    return this.state.isDesktopActive;
  }

  get isMobileActive() {
    return this.state.isMobileActive;
  }
}

@InitAfter('UserService')
export class DualOutputService extends StatefulService<IDualOutputServiceState> {
  static initialState: IDualOutputServiceState = {
    dualOutputMode: false,
    isDesktopActive: true,
    isMobileActive: true,
  };

  // @@@ TODO: maybe
  // @Inject() private transitionsService: TransitionsService;

  get views() {
    return new DualOutputViews(this.state);
  }

  init() {
    super.init();
  }

  toggleDualOutputMode() {
    this.TOGGLE_DUAL_OUTPUT_MODE();
  }

  setDualOutputMode(status: boolean) {
    this.SET_DUAL_OUTPUT_MODE(status);
  }

  @mutation()
  private SET_DUAL_OUTPUT_MODE(status: boolean) {
    this.state.dualOutputMode = status;
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status?: boolean) {
    this.state.dualOutputMode = !this.state.dualOutputMode;
  }
}
