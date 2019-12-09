import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { mutation } from 'services/core/stateful-service';

export enum ELayout {
  Default = 'Default',
  TwoPane = 'TwoPane',
  Classic = 'Classic',
  FourByFour = 'FourByFour',
  Triplets = 'Triplets',
  OnePane = 'OnePane',
}

export enum ELayoutElement {
  Minifeed = 'Minifeed',
  LegacyEvents = 'LegacyEvents',
  Display = 'Display',
  Mixer = 'Mixer',
  Scenes = 'Scenes',
  Sources = 'Sources',
}

interface ILayoutServiceState {
  currentLayout: ELayout;
  slottedElements: { [key in ELayoutElement]?: '1' | '2' | '3' | '4' | '5' | '6' };
  resizes: { bar1: number; bar2?: number };
}

const RESIZE_DEFAULTS = {
  [ELayout.Default]: {
    bar1: 156,
    bar2: 240,
  },
  [ELayout.TwoPane]: {
    bar1: 650,
    bar2: 300,
  },
  [ELayout.Classic]: {
    bar1: 450,
  },
};

export class LayoutService extends PersistentStatefulService<ILayoutServiceState> {
  static defaultState: ILayoutServiceState = {
    currentLayout: ELayout.Default,
    slottedElements: {
      Display: '1',
      Minifeed: '2',
      Scenes: '3',
      Sources: '4',
      Mixer: '5',
    },
    resizes: {
      bar1: 156,
      bar2: 240,
    },
  };

  init() {
    super.init();
  }

  setBarResize(bar: 'bar1' | 'bar2', size: number) {
    this.SET_RESIZE(bar, size);
  }

  changeLayout(layout: ELayout) {
    this.CHANGE_LAYOUT(layout);
  }

  setSlots(slottedElements: { [key in ELayoutElement]?: '1' | '2' | '3' | '4' | '5' | '6' }) {
    this.SET_SLOTS(slottedElements);
  }

  @mutation()
  CHANGE_LAYOUT(layout: ELayout) {
    this.state.currentLayout = layout;
    this.state.slottedElements = {};
    this.state.resizes = RESIZE_DEFAULTS[layout];
  }

  @mutation()
  SET_SLOTS(slottedElements: { [key in ELayoutElement]?: '1' | '2' | '3' | '4' | '5' | '6' }) {
    this.state.slottedElements = slottedElements;
  }

  @mutation()
  SET_RESIZE(bar: 'bar1' | 'bar2', size: number) {
    this.state.resizes[bar] = size;
  }
}
