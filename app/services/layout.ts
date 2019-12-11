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
  [ELayout.Default]: { bar1: 156, bar2: 240 },
  [ELayout.TwoPane]: { bar1: 650, bar2: 300 },
  [ELayout.Classic]: { bar1: 450 },
  [ELayout.FourByFour]: { bar1: 170, bar2: 170 },
  [ELayout.Triplets]: { bar1: 650, bar2: 300 },
  [ELayout.OnePane]: { bar1: 800 },
};

const ELEMENT_MINS = {
  [ELayoutElement.Display]: { x: 150, y: 150 },
  [ELayoutElement.LegacyEvents]: { x: 150, y: 150 },
  [ELayoutElement.Mixer]: { x: 150, y: 150 },
  [ELayoutElement.Minifeed]: { x: 150, y: 150 },
  [ELayoutElement.Sources]: { x: 150, y: 150 },
  [ELayoutElement.Scenes]: { x: 150, y: 150 },
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

  calculateMinimum(orientation: 'x' | 'y', slots: ('1' | '2' | '3' | '4' | '5' | '6')[]) {
    const components = slots.map(slot =>
      Object.keys(this.state.slottedElements).find(
        comp => this.state.slottedElements[comp] === slot,
      ),
    );
    const minimums = components.map(comp => ELEMENT_MINS[comp] || { x: 0, y: 0 });
    const mins = minimums.map((min: { x: number; y: number }) => min[orientation]);
    return Math.max(...mins);
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
