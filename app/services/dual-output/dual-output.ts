import { StatefulService, InitAfter, ViewHandler, mutation } from 'services/core';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';

export type TOutputDisplayType = 'horizontal' | 'vertical';

// @@@ TODO: export?
// interface IDualOutput {
//   dualOutputMode: boolean;
// }

interface IDualOutputServiceState {
  isHorizontalActive: boolean;
  isVerticalActive: boolean;
  dualOutputMode: boolean;
}

class DualOutputViews extends ViewHandler<IDualOutputServiceState> {
  get dualOutputMode() {
    return this.state.dualOutputMode;
  }

  get isHorizontalActive() {
    return this.state.isHorizontalActive;
  }

  get isVerticalActive() {
    return this.state.isVerticalActive;
  }
}

@InitAfter('UserService')
export class DualOutputService extends StatefulService<IDualOutputServiceState> {
  static initialState: IDualOutputServiceState = {
    dualOutputMode: false,
    isHorizontalActive: true,
    isVerticalActive: true,
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

  toggleVerticalVisibility(status?: boolean) {
    this.TOGGLE_VERTICAL_VISIBILITY(status);
  }

  toggleHorizontalVisibility(status?: boolean) {
    this.TOGGLE_HORIZONTAL_VISIBILITY(status);
  }

  @mutation()
  private SET_DUAL_OUTPUT_MODE(status: boolean) {
    this.state.dualOutputMode = status;
    this.state.isHorizontalActive = status;
    this.state.isVerticalActive = status;
  }

  @mutation()
  private TOGGLE_DUAL_OUTPUT_MODE(status?: boolean) {
    if (typeof status === 'undefined') {
      this.state.dualOutputMode = !this.state.dualOutputMode;
    } else {
      this.state.dualOutputMode = status;
    }

    if (this.state.dualOutputMode === false) {
      // reset so both displays will always show when dual output is toggled on
      this.state.isVerticalActive = true;
      this.state.isHorizontalActive = true;
    }
  }

  @mutation()
  private TOGGLE_HORIZONTAL_VISIBILITY(status?: boolean) {
    console.log('horizontal ', status);
    if (typeof status === 'undefined' || 'null') {
      this.state.isHorizontalActive = !this.state.isHorizontalActive;
    } else {
      this.state.isHorizontalActive = status;
    }
  }

  @mutation()
  private TOGGLE_VERTICAL_VISIBILITY(status?: boolean) {
    console.log('vertical ', status);
    if (typeof status === 'undefined' || 'null') {
      this.state.isVerticalActive = !this.state.isVerticalActive;
    } else {
      this.state.isVerticalActive = status;
    }
  }
}
