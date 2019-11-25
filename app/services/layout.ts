import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { mutation } from 'services/core/stateful-service';
import { Inject } from 'services/core';
import { UserService } from 'services/user';

enum ELayout {
  Default = 'Default',
}

enum ELayoutElement {
  Minifeed = 'Minifeed',
  LegacyEvents = 'LegacyEvents',
  Display = 'Display',
  Mixer = 'Mixer',
  Scenes = 'Scenes',
  Sources = 'Sources',
}

interface ILayoutServiceState {
  currentLayout: ELayout;
  slottedWidgets: { [key in ELayoutElement]?: '1' | '2' | '3' | '4' | '5' | '6' };
  resizes: { bar1: number; bar2: number };
}

const RESIZE_DEFAULTS = {
  [ELayout.Default]: {
    bar1: 156,
    bar2: 240,
  },
};

export class LayoutService extends PersistentStatefulService<ILayoutServiceState> {
  @Inject() userService: UserService;

  static defaultState: ILayoutServiceState = {
    currentLayout: ELayout.Default,
    slottedWidgets: {
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

  unslottedElements() {
    return Object.keys(ELayoutElement).filter(
      el => !this.state.slottedWidgets[el],
    ) as ELayoutElement[];
  }

  @mutation()
  CHANGE_LAYOUT(layout: ELayout) {
    this.state.currentLayout = layout;
    this.state.slottedWidgets = {};
    this.state.resizes = RESIZE_DEFAULTS[layout];
  }

  @mutation()
  SLOT_ELEMENT(element: ELayoutElement, slot: '1' | '2' | '3' | '4' | '5' | '6') {
    this.state.slottedWidgets[element] = slot;
  }
}
