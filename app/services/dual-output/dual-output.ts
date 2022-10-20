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

  toggleMobileVisibility(status?: boolean) {
    this.TOGGLE_MOBILE_VISIBILITY(status);
  }

  toggleDesktopVisibility(status?: boolean) {
    this.TOGGLE_DESKTOP_VISIBILITY(status);
  }

  @mutation()
  private SET_DUAL_OUTPUT_MODE(status: boolean) {
    this.state.dualOutputMode = status;
    this.state.isDesktopActive = status;
    this.state.isMobileActive = status;
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status?: boolean) {
    if (typeof status === 'undefined') {
      this.state.dualOutputMode = !this.state.dualOutputMode;
    } else {
      this.state.dualOutputMode = status;
    }
  }

  @mutation()
  private TOGGLE_MOBILE_VISIBILITY(status?: boolean) {
    if (typeof status === 'undefined') {
      this.state.isMobileActive = !this.state.isMobileActive;
    } else {
      this.state.isMobileActive = status;
    }
  }

  @mutation()
  private TOGGLE_DESKTOP_VISIBILITY(status?: boolean) {
    if (typeof status === 'undefined') {
      this.state.isDesktopActive = !this.state.isDesktopActive;
    } else {
      this.state.isDesktopActive = status;
    }
  }
}
